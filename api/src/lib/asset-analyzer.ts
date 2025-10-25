import { Logger } from './logger';
import { supabase } from './supabase';

const logger = new Logger({ module: 'asset-analyzer' });

export interface ProductAsset {
  id: string;
  product_id: string;
  asset_url: string;
  asset_type: 'product' | 'lifestyle' | 'detail' | 'unknown';
  width: number | null;
  height: number | null;
  quality_score: number;
  is_selected: boolean;
  display_order: number;
  created_at: string;
}

export interface AssetAnalysis {
  assetUrl: string;
  assetType: 'product' | 'lifestyle' | 'detail' | 'unknown';
  width: number | null;
  height: number | null;
  qualityScore: number;
  warnings: string[];
  isVerticalCompatible: boolean;
}

/**
 * Analyze image dimensions and quality
 */
export async function analyzeAsset(assetUrl: string): Promise<AssetAnalysis> {
  logger.info('Analyzing asset', { assetUrl });

  const warnings: string[] = [];
  let qualityScore = 100;
  let width: number | null = null;
  let height: number | null = null;
  let isVerticalCompatible = true;

  try {
    // Try to get image metadata
    const imageInfo = await getImageMetadata(assetUrl);

    if (imageInfo) {
      width = imageInfo.width;
      height = imageInfo.height;

      // Check resolution
      if (width && height) {
        const minDimension = Math.min(width, height);

        if (minDimension < 720) {
          warnings.push('Low resolution - may appear pixelated in video');
          qualityScore -= 30;
        } else if (minDimension < 1080) {
          warnings.push('Medium resolution - adequate but not ideal');
          qualityScore -= 15;
        }

        // Check aspect ratio compatibility with 9:16 vertical
        const aspectRatio = width / height;
        if (aspectRatio > 1.5) {
          warnings.push('Very wide image - may not fit well in vertical format');
          isVerticalCompatible = false;
          qualityScore -= 20;
        } else if (aspectRatio > 1.2) {
          warnings.push('Wide image - will be cropped for vertical video');
          qualityScore -= 10;
        }
      }
    }

    // Determine asset type based on URL and characteristics
    const assetType = determineAssetType(assetUrl, width, height);

    // Additional penalties for unknown issues
    if (!width || !height) {
      warnings.push('Could not determine image dimensions');
      qualityScore -= 20;
    }

    logger.info('Asset analyzed', {
      assetUrl,
      assetType,
      qualityScore,
      warningCount: warnings.length,
    });

    return {
      assetUrl,
      assetType,
      width,
      height,
      qualityScore: Math.max(0, Math.min(100, qualityScore)),
      warnings,
      isVerticalCompatible,
    };
  } catch (error) {
    logger.error('Failed to analyze asset', { assetUrl, error });

    return {
      assetUrl,
      assetType: 'unknown',
      width: null,
      height: null,
      qualityScore: 50,
      warnings: ['Could not analyze image'],
      isVerticalCompatible: true,
    };
  }
}

/**
 * Get image metadata
 */
async function getImageMetadata(url: string): Promise<{ width: number; height: number } | null> {
  try {
    // Fetch image to get dimensions
    const response = await fetch(url, { method: 'HEAD' });

    if (!response.ok) {
      return null;
    }

    // Try to get dimensions from Content-Type or other headers
    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.startsWith('image/')) {
      return null;
    }

    // For better dimension detection, we'd need to actually load the image
    // For now, return null and rely on frontend Image.onLoad for accurate dimensions
    return null;
  } catch (error) {
    logger.error('Failed to get image metadata', { url, error });
    return null;
  }
}

/**
 * Determine asset type from URL and characteristics
 */
function determineAssetType(url: string, width: number | null, height: number | null): ProductAsset['asset_type'] {
  const urlLower = url.toLowerCase();

  // Check URL for hints
  if (urlLower.includes('lifestyle') || urlLower.includes('scene') || urlLower.includes('model')) {
    return 'lifestyle';
  }

  if (urlLower.includes('detail') || urlLower.includes('close') || urlLower.includes('zoom')) {
    return 'detail';
  }

  if (urlLower.includes('product') || urlLower.includes('hero') || urlLower.includes('main')) {
    return 'product';
  }

  // Use dimensions as hints
  if (width && height) {
    const aspectRatio = width / height;

    // Square-ish images are often product shots
    if (aspectRatio > 0.9 && aspectRatio < 1.1) {
      return 'product';
    }

    // Very horizontal images are often lifestyle
    if (aspectRatio > 1.5) {
      return 'lifestyle';
    }
  }

  return 'unknown';
}

/**
 * Store asset analysis in database
 */
export async function storeProductAsset(
  productId: string,
  analysis: AssetAnalysis,
  isSelected: boolean = false,
  displayOrder: number = 0
): Promise<ProductAsset> {
  logger.info('Storing product asset', {
    productId,
    assetUrl: analysis.assetUrl,
    qualityScore: analysis.qualityScore,
  });

  try {
    const { data, error } = await supabase
      .from('product_assets')
      .insert({
        product_id: productId,
        asset_url: analysis.assetUrl,
        asset_type: analysis.assetType,
        width: analysis.width,
        height: analysis.height,
        quality_score: analysis.qualityScore,
        is_selected: isSelected,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to store product asset', { error });
      throw error;
    }

    return data as ProductAsset;
  } catch (error) {
    logger.error('Error storing product asset', { error });
    throw error;
  }
}

/**
 * Get all assets for a product
 */
export async function getProductAssets(productId: string): Promise<ProductAsset[]> {
  try {
    const { data, error } = await supabase
      .from('product_assets')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Failed to get product assets', { productId, error });
      throw error;
    }

    return data as ProductAsset[];
  } catch (error) {
    logger.error('Error getting product assets', { error });
    throw error;
  }
}

/**
 * Get selected assets for a product
 */
export async function getSelectedAssets(productId: string): Promise<ProductAsset[]> {
  try {
    const { data, error } = await supabase
      .from('product_assets')
      .select('*')
      .eq('product_id', productId)
      .eq('is_selected', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Failed to get selected assets', { productId, error });
      throw error;
    }

    return data as ProductAsset[];
  } catch (error) {
    logger.error('Error getting selected assets', { error });
    throw error;
  }
}

/**
 * Update asset selection
 */
export async function updateAssetSelection(
  assetId: string,
  isSelected: boolean,
  displayOrder?: number
): Promise<void> {
  logger.info('Updating asset selection', { assetId, isSelected, displayOrder });

  try {
    const updateData: any = { is_selected: isSelected };
    if (displayOrder !== undefined) {
      updateData.display_order = displayOrder;
    }

    const { error } = await supabase.from('product_assets').update(updateData).eq('id', assetId);

    if (error) {
      logger.error('Failed to update asset selection', { error });
      throw error;
    }
  } catch (error) {
    logger.error('Error updating asset selection', { error });
    throw error;
  }
}

/**
 * Analyze and store multiple assets
 */
export async function analyzeAndStoreAssets(productId: string, assetUrls: string[]): Promise<ProductAsset[]> {
  logger.info('Analyzing and storing multiple assets', {
    productId,
    count: assetUrls.length,
  });

  const storedAssets: ProductAsset[] = [];

  for (let i = 0; i < assetUrls.length; i++) {
    const url = assetUrls[i];
    const analysis = await analyzeAsset(url);
    const asset = await storeProductAsset(productId, analysis, false, i);
    storedAssets.push(asset);
  }

  logger.info('All assets analyzed and stored', {
    productId,
    count: storedAssets.length,
  });

  return storedAssets;
}

/**
 * Auto-select best assets for a product
 */
export async function autoSelectBestAssets(productId: string, count: number = 4): Promise<ProductAsset[]> {
  logger.info('Auto-selecting best assets', { productId, count });

  try {
    // Get all assets for product, sorted by quality score
    const { data: assets, error } = await supabase
      .from('product_assets')
      .select('*')
      .eq('product_id', productId)
      .order('quality_score', { ascending: false })
      .limit(count);

    if (error) {
      logger.error('Failed to get assets for auto-selection', { error });
      throw error;
    }

    if (!assets || assets.length === 0) {
      return [];
    }

    // Try to get a mix of asset types if possible
    const selectedAssets: ProductAsset[] = [];
    const remainingAssets = [...assets];

    // First, try to get one of each type
    const typePriority: ProductAsset['asset_type'][] = ['product', 'lifestyle', 'detail'];

    for (const type of typePriority) {
      const assetOfType = remainingAssets.find((a) => a.asset_type === type);
      if (assetOfType && selectedAssets.length < count) {
        selectedAssets.push(assetOfType);
        remainingAssets.splice(remainingAssets.indexOf(assetOfType), 1);
      }
    }

    // Fill remaining slots with best quality
    while (selectedAssets.length < count && remainingAssets.length > 0) {
      selectedAssets.push(remainingAssets.shift()!);
    }

    // Update selection in database
    for (let i = 0; i < selectedAssets.length; i++) {
      await updateAssetSelection(selectedAssets[i].id, true, i);
    }

    logger.info('Auto-selected best assets', {
      productId,
      count: selectedAssets.length,
      types: selectedAssets.map((a) => a.asset_type),
    });

    return selectedAssets;
  } catch (error) {
    logger.error('Error auto-selecting assets', { error });
    throw error;
  }
}

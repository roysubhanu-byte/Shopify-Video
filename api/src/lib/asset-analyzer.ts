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
    const imageInfo = await getImageMetadata(assetUrl);

    if (imageInfo) {
      width = imageInfo.width;
      height = imageInfo.height;

      if (width && height) {
        const minDimension = Math.min(width, height);

        if (minDimension < 720) {
          warnings.push('Low resolution - may appear pixelated in video');
          qualityScore -= 30;
        } else if (minDimension < 1080) {
          warnings.push('Medium resolution - adequate but not ideal');
          qualityScore -= 15;
        }

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
    } else {
      logger.warn('Could not fetch image metadata, using defaults', { assetUrl });
      width = 1080;
      height = 1080;
      qualityScore = 75;
      warnings.push('Image dimensions estimated');
    }

    const assetType = determineAssetType(assetUrl, width, height);

    const finalQualityScore = Math.max(0, Math.min(100, qualityScore));

    logger.info('Asset analyzed', {
      assetUrl: assetUrl.substring(0, 100),
      assetType,
      qualityScore: finalQualityScore,
      dimensions: width && height ? `${width}x${height}` : 'unknown',
      warningCount: warnings.length,
      warnings: warnings.join('; '),
    });

    return {
      assetUrl,
      assetType,
      width,
      height,
      qualityScore: finalQualityScore,
      warnings,
      isVerticalCompatible,
    };
  } catch (error) {
    logger.error('Failed to analyze asset', {
      assetUrl: assetUrl.substring(0, 100),
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      assetUrl,
      assetType: 'product',
      width: 1080,
      height: 1080,
      qualityScore: 70,
      warnings: ['Image dimensions estimated'],
      isVerticalCompatible: true,
    };
  }
}

/**
 * Get image metadata by actually fetching and parsing the image
 */
async function getImageMetadata(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HobaBot/1.0)',
      },
    });

    if (!response.ok) {
      logger.warn('Failed to fetch image for metadata', { url, status: response.status });
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      logger.warn('URL is not an image', { url, contentType });
      return null;
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const dimensions = parseImageDimensions(bytes, contentType);
    if (dimensions) {
      logger.info('Successfully extracted image dimensions', { url, ...dimensions });
    }
    return dimensions;
  } catch (error) {
    logger.error('Failed to get image metadata', { url, error });
    return null;
  }
}

/**
 * Parse image dimensions from raw image bytes
 */
function parseImageDimensions(
  bytes: Uint8Array,
  contentType: string
): { width: number; height: number } | null {
  try {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      return parseJPEGDimensions(bytes);
    } else if (contentType.includes('png')) {
      return parsePNGDimensions(bytes);
    } else if (contentType.includes('webp')) {
      return parseWebPDimensions(bytes);
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Parse JPEG dimensions
 */
function parseJPEGDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
      return { width, height };
    }
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    offset += length + 2;
  }
  return null;
}

/**
 * Parse PNG dimensions
 */
function parsePNGDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  return { width, height };
}

/**
 * Parse WebP dimensions
 */
function parseWebPDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 30) return null;
  if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4c) {
    const width = 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]);
    const height = 1 + (((bytes[24] & 0xf) << 10) | (bytes[23] << 2) | ((bytes[22] & 0xc0) >> 6));
    return { width, height };
  }
  return null;
}

/**
 * Determine asset type from URL and characteristics
 */
function determineAssetType(url: string, width: number | null, height: number | null): ProductAsset['asset_type'] {
  const urlLower = url.toLowerCase();

  // Skip logos and icons - mark as unknown so they can be filtered
  if (urlLower.includes('logo') ||
      urlLower.includes('icon') ||
      urlLower.includes('favicon') ||
      urlLower.includes('badge') ||
      urlLower.includes('avatar')) {
    return 'unknown';
  }

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
    const minDimension = Math.min(width, height);

    // Very small images are likely logos/icons
    if (minDimension < 200) {
      return 'unknown';
    }

    // Square-ish images are often product shots
    if (aspectRatio > 0.9 && aspectRatio < 1.1) {
      return 'product';
    }

    // Very horizontal images are often lifestyle
    if (aspectRatio > 1.5) {
      return 'lifestyle';
    }
  }

  return 'product';
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
    logger.info('Fetching selected assets', { productId });

    const { data, error } = await supabase
      .from('product_assets')
      .select('*')
      .eq('product_id', productId)
      .eq('is_selected', true)
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('Failed to get selected assets', { productId, error });
      // Don't throw, return empty array to allow fallback
      return [];
    }

    const assets = (data || []) as ProductAsset[];
    logger.info('Selected assets retrieved', {
      productId,
      count: assets.length,
      assetIds: assets.map(a => a.id),
      urls: assets.map(a => a.asset_url.substring(0, 80))
    });

    return assets;
  } catch (error) {
    logger.error('Error getting selected assets', { productId, error });
    // Return empty array instead of throwing to allow fallback logic
    return [];
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
    urls: assetUrls.map(u => u.substring(0, 80)),
  });

  const storedAssets: ProductAsset[] = [];
  const errors: Array<{ url: string; error: string }> = [];

  for (let i = 0; i < assetUrls.length; i++) {
    const url = assetUrls[i];
    try {
      logger.info(`Analyzing asset ${i + 1}/${assetUrls.length}`, {
        url: url.substring(0, 100),
        productId,
      });

      const analysis = await analyzeAsset(url);
      const asset = await storeProductAsset(productId, analysis, false, i);
      storedAssets.push(asset);

      logger.info(`Asset ${i + 1} stored successfully`, {
        assetId: asset.id,
        type: asset.asset_type,
        qualityScore: asset.quality_score,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to analyze/store asset ${i + 1}`, {
        url: url.substring(0, 100),
        error: errorMsg,
      });
      errors.push({ url: url.substring(0, 100), error: errorMsg });
    }
  }

  logger.info('Asset analysis complete', {
    productId,
    totalUrls: assetUrls.length,
    successCount: storedAssets.length,
    errorCount: errors.length,
    errors: errors.length > 0 ? errors : undefined,
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

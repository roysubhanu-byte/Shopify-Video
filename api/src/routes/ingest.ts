import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { ingestProductURL, validateProductData } from '../lib/ingest';
import { generateBrandKit } from '../lib/brand-kit';
import { generate3Concepts } from '../lib/concept-factory';
import { Logger } from '../lib/logger';
import { analyzeAndStoreAssets, getProductAssets } from '../lib/asset-analyzer';

const router = Router();
const logger = new Logger({ module: 'ingest-route' });

router.post('/api/ingest/url', async (req, res) => {
  try {
    const { url, userId } = req.body;

    // Log received request for debugging
    logger.info('Received ingest request', {
      hasUrl: !!url,
      hasUserId: !!userId,
      urlType: typeof url,
      userIdType: typeof userId,
    });

    if (!url || !userId) {
      const missing = [];
      if (!url) missing.push('url');
      if (!userId) missing.push('userId');

      return res.status(400).json({
        error: 'Missing required fields',
        required: ['url', 'userId'],
        missing,
        message: `Please provide: ${missing.join(', ')}. You may need to sign in again.`,
      });
    }

    logger.info('Starting URL ingest', { url, userId });

    let productData;
    try {
      productData = await ingestProductURL(url);
    } catch (error: any) {
      logger.error('Ingest failed', error, { url });
      return res.status(400).json({
        error: 'Failed to extract product data',
        details: error.message,
        suggestion: 'Make sure the URL is accessible and contains product information',
      });
    }

    const validation = validateProductData(productData);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Insufficient product data',
        missing: validation.missing,
      });
    }

    const brandKit = await generateBrandKit(productData.brandName!, productData.brandColors);
    const concepts = await generate3Concepts(productData, brandKit);

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        user_id: userId,
        url: productData.url,
        title: productData.title,
        description: productData.description,
        bullets: productData.bullets,
        price: productData.price,
        currency: productData.currency,
        images: productData.images,
        brand_name: productData.brandName,
        brand_colors: productData.brandColors,
        reviews_avg: productData.reviews?.average,
        reviews_count: productData.reviews?.count,
      })
      .select()
      .maybeSingle();

    if (productError) {
      logger.error('Failed to store product', productError);
    }

    const { data: kit, error: kitError } = await supabase
      .from('brand_kits')
      .insert({
        user_id: userId,
        product_id: product?.id,
        brand_name: brandKit.brandName,
        logo_svg: brandKit.logoSvg,
        palette: brandKit.palette,
        style: brandKit.style,
      })
      .select()
      .maybeSingle();

    if (kitError) {
      logger.error('Failed to store brand kit', kitError);
    }

    let assets: any[] = [];
    if (product?.id && productData.images.length > 0) {
      try {
        assets = await analyzeAndStoreAssets(product.id, productData.images);
        logger.info('Assets analyzed and stored', {
          productId: product.id,
          assetCount: assets.length,
        });
      } catch (error) {
        logger.error('Failed to analyze assets', error);
      }
    }

    logger.info('Ingest complete', {
      userId,
      productId: product?.id,
      brandKitId: kit?.id,
      conceptCount: concepts.length,
      assetCount: assets.length,
    });

    res.json({
      success: true,
      product: {
        id: product?.id,
        url: productData.url,
        title: productData.title,
        description: productData.description,
        bullets: productData.bullets,
        price: productData.price,
        currency: productData.currency,
        images: productData.images,
        reviews: productData.reviews,
      },
      brandKit: {
        id: kit?.id,
        brandName: brandKit.brandName,
        logoSvg: brandKit.logoSvg,
        palette: brandKit.palette,
        style: brandKit.style,
      },
      concepts: concepts.map((c) => ({
        id: c.id,
        label: c.label,
        seed: c.seed,
        hookPattern: c.hookPattern,
        hookExample: c.hookExample,
        script: c.script,
        vertical: c.vertical,
      })),
      assets: assets.map((a) => ({
        id: a.id,
        url: a.asset_url,
        type: a.asset_type,
        qualityScore: a.quality_score,
        width: a.width,
        height: a.height,
      })),
      assetSelectionRequired: assets.length > 0,
    });
  } catch (error) {
    logger.error('Ingest error', error);
    res.status(500).json({
      error: 'Failed to process URL',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/api/ingest/products', async (req, res) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter required' });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*, brand_kits(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      logger.error('Failed to fetch products', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    res.json({
      products: products || [],
      count: products?.length || 0,
    });
  } catch (error) {
    logger.error('Products fetch error', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

export default router;

import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { Logger } from '../lib/logger';
import { renderStaticPNG } from '../lib/staticRenderer';
import { uploadPublic, serveStaticFile } from '../lib/storage';
import { Plan } from '../types/plan';

const router = Router();
const logger = new Logger({ module: 'static-route' });

router.post('/api/render/static', async (req, res) => {
  try {
    const { variantId, layout, userId } = req.body;

    if (!variantId) {
      return res.status(400).json({
        error: 'Missing required field: variantId',
      });
    }

    logger.info('Generating static images', { variantId, layout, userId });

    const { data: variant, error: variantError } = await supabase
      .from('variants')
      .select('*, projects(*, products(*), brand_kits(*))')
      .eq('id', variantId)
      .maybeSingle();

    if (variantError || !variant) {
      logger.error('Variant not found', { variantId, error: variantError });
      return res.status(404).json({ error: 'Variant not found' });
    }

    const projectUserId = variant.projects?.user_id;

    if (userId && projectUserId) {
      const STATIC_CREDIT_COST = 5;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', projectUserId)
        .maybeSingle();

      if (userError) {
        logger.warn('Failed to fetch user credits', { error: userError, userId: projectUserId });
      } else if (userData) {
        const currentCredits = userData.credits || 0;

        if (currentCredits < STATIC_CREDIT_COST) {
          logger.warn('Insufficient credits for static generation', {
            userId: projectUserId,
            needed: STATIC_CREDIT_COST,
            current: currentCredits,
          });

          return res.status(402).json({
            error: 'Insufficient credits',
            needed: STATIC_CREDIT_COST,
            current: currentCredits,
          });
        }

        const { error: deductError } = await supabase
          .from('users')
          .update({ credits: currentCredits - STATIC_CREDIT_COST })
          .eq('id', projectUserId);

        if (deductError) {
          logger.error('Failed to deduct credits', { error: deductError, userId: projectUserId });
          return res.status(500).json({ error: 'Failed to process credits' });
        }

        logger.info('Credits deducted for static generation', {
          userId: projectUserId,
          amount: STATIC_CREDIT_COST,
          remaining: currentCredits - STATIC_CREDIT_COST,
        });
      }
    }

    if (!variant.script_json) {
      return res.status(400).json({ error: 'Variant missing plan' });
    }

    const plan = variant.script_json as Plan;
    const project = variant.projects;
    const product = project?.products;
    const brandKit = project?.brand_kits;

    if (!product || !brandKit) {
      return res.status(400).json({
        error: 'Variant missing product or brand kit data',
      });
    }

    const hookBeat = plan.beats.find((b) => b.type === 'hook');
    const ctaBeat = plan.beats.find((b) => b.type === 'cta');

    const hookText = hookBeat?.overlays?.[0]?.text || hookBeat?.voiceOver?.text || plan.hookText;
    const ctaText = ctaBeat?.overlays?.[0]?.text || 'Get Yours Now';

    const brandBg = brandKit.palette?.primary || '#1a1a1a';
    const brandSlate = '#334155';
    const accent = brandKit.palette?.accent || brandKit.palette?.secondary || '#ff6b35';

    const productImages = product.images || [];
    const logoPngUrl = brandKit.logo_png_url;

    const variants = [
      {
        name: 'v1',
        backgroundImageUrl: productImages[0],
        brandBg: productImages[0] ? undefined : brandBg,
        position: 'top' as const,
      },
      {
        name: 'v2',
        backgroundImageUrl: productImages[1] || productImages[0],
        brandBg: (productImages[1] || productImages[0]) ? undefined : brandBg,
        position: 'center' as const,
      },
      {
        name: 'v3',
        backgroundImageUrl: undefined,
        brandBg: brandSlate,
        position: 'bottom' as const,
      },
    ];

    logger.info('Rendering 3 static variants', {
      variantId,
      hookText,
      ctaText,
      brandBg,
      accent,
    });

    const imageUrls: string[] = [];

    for (let i = 0; i < variants.length; i++) {
      const variantConfig = variants[i];

      try {
        const imageBuffer = await renderStaticPNG({
          width: 1080,
          height: 1920,
          backgroundImageUrl: variantConfig.backgroundImageUrl,
          brandBg: variantConfig.brandBg || brandBg,
          accent,
          hookText,
          ctaText,
          position: variantConfig.position,
          logoPngUrl,
        });

        const filePath = `static/${variantId}_${i + 1}.png`;
        const publicUrl = await uploadPublic(imageBuffer, filePath, 'image/png');

        imageUrls.push(publicUrl);

        logger.info('Static image variant uploaded', {
          variant: variantConfig.name,
          url: publicUrl,
          size: imageBuffer.length,
        });
      } catch (error) {
        logger.error('Failed to generate static variant', {
          variant: variantConfig.name,
          error,
        });
      }
    }

    if (imageUrls.length === 0) {
      return res.status(500).json({
        error: 'Failed to generate any static images',
      });
    }

    await supabase
      .from('variants')
      .update({
        static_image_urls: imageUrls,
      })
      .eq('id', variantId);

    logger.info('Static images generated successfully', {
      variantId,
      count: imageUrls.length,
    });

    res.json({
      success: true,
      variantId,
      imageUrls,
      count: imageUrls.length,
    });
  } catch (error) {
    logger.error('Static render error', { error });
    res.status(500).json({
      error: 'Failed to generate static images',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/static/*', async (req, res) => {
  try {
    const filePath = req.params[0];

    if (!filePath) {
      return res.status(400).json({ error: 'Missing file path' });
    }

    const buffer = await serveStaticFile(filePath);

    if (!buffer) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(buffer);
  } catch (error) {
    logger.error('Static file serve error', { error });
    res.status(500).json({ error: 'Failed to serve static file' });
  }
});

export default router;

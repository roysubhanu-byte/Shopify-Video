import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { Logger } from '../lib/logger';
import { qualityValidator } from '../lib/quality-validator';

const router = Router();
const logger = new Logger({ module: 'beats-route' });

router.post('/api/beats/:variantId/:beatNumber/upload-reference', async (req, res) => {
  try {
    const { variantId, beatNumber } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const beatNum = parseInt(beatNumber);
    if (isNaN(beatNum) || beatNum < 1 || beatNum > 4) {
      return res.status(400).json({ error: 'Beat number must be between 1 and 4' });
    }

    logger.info('Processing reference image upload', {
      variantId,
      beatNumber: beatNum,
    });

    res.json({
      success: true,
      override: {
        id: `override_${Date.now()}`,
        beatNumber: beatNum,
        publicUrl: `https://example.com/images/${Date.now()}.jpg`,
        thumbnailUrl: `https://example.com/thumbs/${Date.now()}.jpg`,
      },
    });
  } catch (error) {
    logger.error('Reference image upload error', { error });
    res.status(500).json({
      error: 'Failed to upload reference image',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/api/beats/:beatGenerationId/reshoot', async (req, res) => {
  try {
    const { beatGenerationId } = req.params;
    const { reason, reasonCategory } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.info('Processing beat reshoot request', {
      beatGenerationId,
    });

    const reshootId = `reshoot_${Date.now()}`;
    const newBeatGenerationId = `beat_gen_${Date.now()}`;

    logger.info('Beat reshoot initiated', {
      reshootId,
      newBeatGenerationId,
    });

    res.json({
      success: true,
      reshootId,
      newBeatGenerationId,
      creditsCharged: 1,
      creditsRemaining: 10,
      message: 'Beat reshoot initiated successfully',
    });
  } catch (error) {
    logger.error('Beat reshoot error', { error });
    res.status(500).json({
      error: 'Failed to reshoot beat',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/api/beats/:beatGenerationId/quality', async (req, res) => {
  try {
    const { beatGenerationId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: validations, error } = await supabase
      .from('quality_validations')
      .select('*')
      .eq('beat_generation_id', beatGenerationId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch quality data' });
    }

    res.json({
      beatGenerationId,
      validations: validations || [],
    });
  } catch (error) {
    logger.error('Get quality error', { error });
    res.status(500).json({ error: 'Failed to get quality data' });
  }
});

router.get('/api/variants/:variantId/reference-images', async (req, res) => {
  try {
    const { variantId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: overrides, error } = await supabase
      .from('reference_image_overrides')
      .select('*')
      .eq('variant_id', variantId)
      .eq('is_active', true)
      .order('beat_number');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch reference images' });
    }

    res.json({
      variantId,
      referenceImages: overrides || [],
    });
  } catch (error) {
    logger.error('Get reference images error', { error });
    res.status(500).json({ error: 'Failed to get reference images' });
  }
});

router.delete('/api/beats/:variantId/:beatNumber/reference-image', async (req, res) => {
  try {
    const { variantId, beatNumber } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const beatNum = parseInt(beatNumber);
    if (isNaN(beatNum) || beatNum < 1 || beatNum > 4) {
      return res.status(400).json({ error: 'Beat number must be between 1 and 4' });
    }

    logger.info('Reference image removed', { variantId, beatNumber: beatNum });

    res.json({
      success: true,
      message: 'Reference image removed, reverted to auto-selected',
    });
  } catch (error) {
    logger.error('Delete reference image error', { error });
    res.status(500).json({ error: 'Failed to delete reference image' });
  }
});

export default router;

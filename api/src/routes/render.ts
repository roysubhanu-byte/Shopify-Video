import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { Logger } from '../lib/logger';
import { compilePreviewPrompt, compileFinalPrompt, validateCompiledPrompt } from '../lib/promptCompiler';
import { Plan } from '../../../packages/shared/src/plan';
import { createVEO3Client } from '../lib/veo3-client';

const router = Router();
const logger = new Logger({ module: 'render-route' });

/**
 * POST /api/render/previews
 * Generate preview renders for all variants
 */
router.post('/api/render/previews', async (req, res) => {
  try {
    const { projectId, userId } = req.body;

    if (!projectId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['projectId', 'userId'],
      });
    }

    logger.info('Starting preview renders', { projectId, userId });

    // Get all variants with plans
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('*')
      .eq('project_id', projectId);

    if (variantsError || !variants || variants.length === 0) {
      logger.error('No variants found', { projectId, error: variantsError });
      return res.status(404).json({ error: 'No variants found for project' });
    }

    const runs: any[] = [];
    const veo3Client = createVEO3Client('veo_fast');

    for (const variant of variants) {
      if (!variant.script_json) {
        logger.warn('Variant missing plan', { variantId: variant.id });
        continue;
      }

      const plan = variant.script_json as Plan;

      // Compile prompt
      const { system, user, control } = compilePreviewPrompt(plan);

      // Validate compiled prompt
      const validation = validateCompiledPrompt({ system, user, control });
      if (!validation.valid) {
        logger.error('Compiled prompt validation failed', {
          variantId: variant.id,
          errors: validation.errors,
        });
        continue;
      }

      // Create run record first to get runId for webhook
      const { data: run, error: runError } = await supabase
        .from('runs')
        .insert({
          variant_id: variant.id,
          engine: 'veo_fast',
          state: 'queued',
          veo_model: 'veo_fast',
          beat_duration: 6,
          request_json: control,
          cost_seconds: 9,
        })
        .select()
        .maybeSingle();

      if (runError || !run) {
        logger.error('Failed to create run', { variantId: variant.id, error: runError });
        continue;
      }

      // Build webhook URL with runId
      const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 8787}`;
      const webhookUrl = `${baseUrl}/webhooks/veo?runId=${run.id}`;

      // Get seed from plan or use variant seed
      const seed = plan.beats[0]?.seed || variant.seed || 341991;

      // Get first beat's assets for the 9s preview
      const firstBeat = plan.beats[0];
      const referenceImages = firstBeat?.assetRefs.map((a) => a.url) || [];

      logger.info('Calling VEO3 Fast', {
        runId: run.id,
        variantId: variant.id,
        seed,
        webhookUrl,
        imageCount: referenceImages.length,
      });

      // Call VEO3 Fast API
      try {
        // Update run to running state
        await supabase
          .from('runs')
          .update({ state: 'running' })
          .eq('id', run.id);

        const veoResult = await veo3Client.generateVideo({
          prompt: `${system}\n\n${user}`,
          duration: 9,
          aspectRatio: '9:16',
          referenceImages,
          includeAudio: false,
        });

        logger.info('VEO3 Fast called successfully', {
          runId: run.id,
          jobId: veoResult.jobId,
          status: veoResult.status,
        });

        // Store VEO3 job ID
        await supabase
          .from('runs')
          .update({
            response_json: { veoJobId: veoResult.jobId, webhookUrl },
          })
          .eq('id', run.id);

        runs.push(run);

        // Update variant status
        await supabase
          .from('variants')
          .update({ status: 'previewing' })
          .eq('id', variant.id);

      } catch (veoError) {
        logger.error('VEO3 API call failed', {
          runId: run.id,
          error: veoError,
        });

        await supabase
          .from('runs')
          .update({
            state: 'failed',
            error: veoError instanceof Error ? veoError.message : 'VEO3 API call failed',
          })
          .eq('id', run.id);

        await supabase
          .from('variants')
          .update({ status: 'error' })
          .eq('id', variant.id);
      }
    }

    logger.info('Preview renders initiated', {
      projectId,
      runCount: runs.length,
    });

    res.json({
      success: true,
      runs: runs.map((r) => ({
        id: r.id,
        variantId: r.variant_id,
        engine: r.engine,
        state: r.state,
      })),
      message: `${runs.length} preview renders initiated with VEO3 Fast`,
    });
  } catch (error) {
    logger.error('Preview render error', { error });
    res.status(500).json({
      error: 'Failed to queue preview renders',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/render/finals
 * Generate final renders with audio
 */
router.post('/api/render/finals', async (req, res) => {
  try {
    const { projectId, userId, audioUrl } = req.body;

    if (!projectId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['projectId', 'userId'],
      });
    }

    logger.info('Starting final renders', { projectId, userId, audioUrl });

    // Get all variants with plans
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('*')
      .eq('project_id', projectId);

    if (variantsError || !variants || variants.length === 0) {
      logger.error('No variants found', { projectId, error: variantsError });
      return res.status(404).json({ error: 'No variants found for project' });
    }

    // Check user credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) {
      logger.error('User not found', { userId, error: userError });
      return res.status(404).json({ error: 'User not found' });
    }

    const requiredCredits = 3; // 3 credits for 3 final videos
    if (user.credits < requiredCredits) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: requiredCredits,
        available: user.credits,
      });
    }

    const runs: any[] = [];

    for (const variant of variants) {
      if (!variant.script_json) {
        logger.warn('Variant missing plan', { variantId: variant.id });
        continue;
      }

      const plan = variant.script_json as Plan;

      // Compile prompt with audio URL
      const compiled = audioUrl
        ? compileFinalPrompt(plan, audioUrl)
        : compilePreviewPrompt(plan);

      // Validate compiled prompt
      const validation = validateCompiledPrompt(compiled);
      if (!validation.valid) {
        logger.error('Compiled prompt validation failed', {
          variantId: variant.id,
          errors: validation.errors,
        });
        continue;
      }

      // Create run record
      const { data: run, error: runError } = await supabase
        .from('runs')
        .insert({
          variant_id: variant.id,
          engine: 'veo_fast',
          state: 'queued',
          veo_model: 'veo_fast',
          beat_duration: 6,
          request_json: compiled.control,
          cost_seconds: plan.targetDuration,
        })
        .select()
        .maybeSingle();

      if (runError) {
        logger.error('Failed to create run', { variantId: variant.id, error: runError });
        continue;
      }

      runs.push(run);

      // Update variant status
      await supabase
        .from('variants')
        .update({ status: 'finalizing' })
        .eq('id', variant.id);

      logger.info('Final render queued', {
        variantId: variant.id,
        runId: run?.id,
      });
    }

    // Deduct credits
    await supabase
      .from('users')
      .update({ credits: user.credits - requiredCredits })
      .eq('id', userId);

    logger.info('Final renders queued', {
      projectId,
      runCount: runs.length,
      creditsCharged: requiredCredits,
    });

    res.json({
      success: true,
      runs: runs.map((r) => ({
        id: r.id,
        variantId: r.variant_id,
        engine: r.engine,
        state: r.state,
      })),
      creditsCharged: requiredCredits,
      creditsRemaining: user.credits - requiredCredits,
      message: 'Final renders queued. In production, VEO3 API would be called here.',
    });
  } catch (error) {
    logger.error('Final render error', { error });
    res.status(500).json({
      error: 'Failed to queue final renders',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/render/:runId/status
 * Get render status
 */
router.get('/api/render/:runId/status', async (req, res) => {
  try {
    const { runId } = req.params;

    const { data: run, error } = await supabase
      .from('runs')
      .select('*, variants(*)')
      .eq('id', runId)
      .maybeSingle();

    if (error || !run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    res.json({
      id: run.id,
      variantId: run.variant_id,
      engine: run.engine,
      state: run.state,
      videoUrl: run.variants?.video_url,
      error: run.error,
      createdAt: run.created_at,
    });
  } catch (error) {
    logger.error('Get render status error', { error });
    res.status(500).json({ error: 'Failed to get render status' });
  }
});

export default router;

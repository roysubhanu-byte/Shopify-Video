import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { Logger } from '../lib/logger';
import { compilePreviewPrompt, compileFinalPrompt, validateCompiledPrompt } from '../lib/promptCompiler';
import { Plan } from '../../../packages/shared/src/plan';
import { createVEO3Client } from '../lib/veo3-client';
import { generateTTSForBeats, validateTTSResult } from '../lib/tts-service';

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
    const veo3Client = createVEO3Client('veo_fast');

    for (const variant of variants) {
      if (!variant.script_json) {
        logger.warn('Variant missing plan', { variantId: variant.id });
        continue;
      }

      const plan = variant.script_json as Plan;

      // Step 1: Generate TTS audio for all beats with word timestamps
      logger.info('Generating TTS for final video', {
        variantId: variant.id,
        beatCount: plan.beats.length,
      });

      const ttsResult = await generateTTSForBeats(plan.beats);

      // Validate TTS result
      const ttsValidation = validateTTSResult(ttsResult, plan.targetDuration);
      if (!ttsValidation.valid) {
        logger.error('TTS validation failed', {
          variantId: variant.id,
          errors: ttsValidation.errors,
        });
        continue;
      }

      logger.info('TTS generated successfully', {
        variantId: variant.id,
        audioUrl: ttsResult.audioUrl,
        duration: ttsResult.duration,
        wordCount: ttsResult.allWordTimestamps.length,
      });

      // Step 2: Compile final prompt with TTS audio URL
      const { system, user, control } = compileFinalPrompt(plan, ttsResult.audioUrl);

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
          engine: 'veo_3',
          state: 'queued',
          veo_model: 'veo_3',
          beat_duration: 6,
          request_json: control,
          cost_seconds: plan.targetDuration,
        })
        .select()
        .maybeSingle();

      if (runError || !run) {
        logger.error('Failed to create run', { variantId: variant.id, error: runError });
        continue;
      }

      // Store TTS data in run for webhook to use
      await supabase
        .from('runs')
        .update({
          response_json: {
            ttsResult: {
              audioUrl: ttsResult.audioUrl,
              wordTimestamps: ttsResult.allWordTimestamps,
              duration: ttsResult.duration,
            },
          },
        })
        .eq('id', run.id);

      // Build webhook URL with runId
      const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 8787}`;
      const webhookUrl = `${baseUrl}/webhooks/veo?runId=${run.id}`;

      // Get seed from plan or use variant seed
      const seed = plan.beats[0]?.seed || variant.seed || 341991;

      // Get all assets for the full video
      const allAssetUrls = plan.selectedAssets.map((a) => a.url);

      logger.info('Calling VEO3 for final video', {
        runId: run.id,
        variantId: variant.id,
        seed,
        webhookUrl,
        audioUrl: ttsResult.audioUrl,
        assetCount: allAssetUrls.length,
      });

      // Step 3: Call VEO3 (full model) with audio and beat windows
      try {
        // Update run to running state
        await supabase
          .from('runs')
          .update({ state: 'running' })
          .eq('id', run.id);

        const veoResult = await veo3Client.generateVideo({
          prompt: `${system}\n\n${user}`,
          duration: plan.targetDuration, // 20-24s for final
          aspectRatio: '9:16',
          referenceImages: allAssetUrls,
          includeAudio: true,
        });

        logger.info('VEO3 called successfully for final', {
          runId: run.id,
          jobId: veoResult.jobId,
          status: veoResult.status,
        });

        // Update with VEO3 job ID
        await supabase
          .from('runs')
          .update({
            response_json: {
              veoJobId: veoResult.jobId,
              webhookUrl,
              ttsResult: {
                audioUrl: ttsResult.audioUrl,
                wordTimestamps: ttsResult.allWordTimestamps,
                duration: ttsResult.duration,
              },
            },
          })
          .eq('id', run.id);

        runs.push(run);

        // Update variant status
        await supabase
          .from('variants')
          .update({ status: 'finalizing' })
          .eq('id', variant.id);

      } catch (veoError) {
        logger.error('VEO3 API call failed for final', {
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

    // Deduct credits
    await supabase
      .from('users')
      .update({ credits: user.credits - requiredCredits })
      .eq('id', userId);

    logger.info('Final renders initiated', {
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
      message: `${runs.length} final renders initiated with TTS audio and VEO3`,
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
 * POST /api/render/swap-hook
 * Generate new preview with swapped hook line
 */
router.post('/api/render/swap-hook', async (req, res) => {
  try {
    const { variantId, newHookLine, userId } = req.body;

    if (!variantId || !newHookLine) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['variantId', 'newHookLine'],
      });
    }

    logger.info('Starting hook swap', { variantId, newHookLine });

    // Get variant with plan
    const { data: variant, error: variantError } = await supabase
      .from('variants')
      .select('*')
      .eq('id', variantId)
      .maybeSingle();

    if (variantError || !variant) {
      logger.error('Variant not found', { variantId, error: variantError });
      return res.status(404).json({ error: 'Variant not found' });
    }

    if (!variant.script_json) {
      return res.status(400).json({ error: 'Variant missing plan' });
    }

    // Load plan and replace HOOK beat
    const plan = variant.script_json as Plan;
    const hookBeat = plan.beats.find((b) => b.type === 'hook');

    if (!hookBeat) {
      return res.status(400).json({ error: 'Plan missing HOOK beat' });
    }

    // Keep seed and visuals; replace only hook text
    if (hookBeat.voiceOver) {
      hookBeat.voiceOver.text = newHookLine;
    }
    if (hookBeat.overlays && hookBeat.overlays.length > 0) {
      // Keep first 6 words for overlay
      const words = newHookLine.split(/\s+/).slice(0, 6);
      hookBeat.overlays[0].text = words.join(' ');
    }

    logger.info('Hook replaced in plan', {
      variantId,
      oldOverlay: variant.script_json.beats.find((b: any) => b.type === 'hook')?.overlays?.[0]?.text,
      newOverlay: hookBeat.overlays?.[0]?.text,
    });

    // Save updated plan
    await supabase
      .from('variants')
      .update({ script_json: plan })
      .eq('id', variantId);

    // Compile preview prompt with new plan
    const { system, user, control } = compilePreviewPrompt(plan);

    // Validate compiled prompt
    const validation = validateCompiledPrompt({ system, user, control });
    if (!validation.valid) {
      logger.error('Compiled prompt validation failed', {
        variantId,
        errors: validation.errors,
      });
      return res.status(400).json({
        error: 'Compiled prompt validation failed',
        details: validation.errors,
      });
    }

    // Check credits if userId provided
    if (userId) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .maybeSingle();

      if (userError || !user) {
        logger.error('User not found', { userId, error: userError });
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.credits < 1) {
        return res.status(402).json({
          error: 'Insufficient credits',
          required: 1,
          available: user.credits,
        });
      }

      // Deduct 1 preview credit
      await supabase
        .from('users')
        .update({ credits: user.credits - 1 })
        .eq('id', userId);

      logger.info('Preview credit deducted', { userId, remaining: user.credits - 1 });
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
        request_json: control,
        cost_seconds: 9,
      })
      .select()
      .maybeSingle();

    if (runError || !run) {
      logger.error('Failed to create run', { variantId, error: runError });
      return res.status(500).json({ error: 'Failed to create run record' });
    }

    // Build webhook URL with runId
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 8787}`;
    const webhookUrl = `${baseUrl}/webhooks/veo?runId=${run.id}`;

    // Get seed from plan or use variant seed
    const seed = plan.beats[0]?.seed || variant.seed || 341991;

    // Get first beat's assets for the 9s preview
    const firstBeat = plan.beats[0];
    const referenceImages = firstBeat?.assetRefs.map((a) => a.url) || [];

    logger.info('Calling VEO3 Fast for hook swap', {
      runId: run.id,
      variantId,
      seed,
      webhookUrl,
      imageCount: referenceImages.length,
      newHookLine,
    });

    // Call VEO3 Fast API
    const veo3Client = createVEO3Client('veo_fast');

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

      logger.info('VEO3 Fast called successfully for hook swap', {
        runId: run.id,
        jobId: veoResult.jobId,
        status: veoResult.status,
      });

      // Store VEO3 job ID
      await supabase
        .from('runs')
        .update({
          response_json: { veoJobId: veoResult.jobId, webhookUrl, hookSwap: true },
        })
        .eq('id', run.id);

      // Update variant status
      await supabase
        .from('variants')
        .update({ status: 'previewing' })
        .eq('id', variant.id);

      res.json({
        success: true,
        runId: run.id,
        variantId,
        newHookLine,
        message: 'Hook swap preview initiated with VEO3 Fast',
        creditsCharged: userId ? 1 : 0,
      });

    } catch (veoError) {
      logger.error('VEO3 API call failed for hook swap', {
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

      return res.status(500).json({
        error: 'VEO3 API call failed',
        details: veoError instanceof Error ? veoError.message : 'Unknown error',
      });
    }

  } catch (error) {
    logger.error('Hook swap error', { error });
    res.status(500).json({
      error: 'Failed to swap hook',
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

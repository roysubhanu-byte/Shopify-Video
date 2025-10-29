import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { Logger } from '../lib/logger';
import { compilePreviewPrompt, compileFinalPrompt, validateCompiledPrompt } from '../lib/promptCompiler';
import { Plan } from '../types/plan';
import { generateVideoWithVeo3, startVideoGeneration, pollVideoGenerationAndSave } from '../lib/veo3-service';
import { generateTTSForBeats, validateTTSResult } from '../lib/tts-service';
import { hasGoogle } from '../lib/google';

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

    // ⬅️ Block only the Google/VEO path if key is missing
    if (!hasGoogle()) {
      return res.status(400).json({
        error:
          'Google (Gemini/Veo) key missing — set GOOGLE_API_KEY or GEMINI_API_KEY (or GOOGLE_VEO3_API_KEY) to enable video previews.',
      });
    }

    logger.info('[RENDER] Starting preview renders', { projectId, userId });

    // Get all variants with plans - but only process Concept A for now
    const { data: variants, error: variantsError } = await supabase
      .from('variants')
      .select('*')
      .eq('project_id', projectId)
      .eq('concept_tag', 'A') // Only get Concept A
      .limit(1); // Only one video

    if (variantsError || !variants || variants.length === 0) {
      logger.error('[RENDER] No variants found', { projectId, error: variantsError });
      return res.status(404).json({ error: 'No variants found for project' });
    }

    logger.info('[RENDER] Processing variants', { count: variants.length, conceptTags: variants.map(v => v.concept_tag) });

    const runs: any[] = [];

    for (const variant of variants) {
      if (!variant.script_json) {
        logger.warn('Variant missing plan', { variantId: variant.id });
        continue;
      }

      const plan = variant.script_json as Plan;

      logger.info('[RENDER] Processing variant', {
        variantId: variant.id,
        conceptTag: variant.concept_tag,
        conceptType: plan.conceptType,
      });

      // Compile prompt
      const { system, user, control } = compilePreviewPrompt(plan);

      logger.info('[RENDER] Prompt compiled', {
        variantId: variant.id,
        systemLength: system.length,
        userLength: user.length,
      });

      // Validate compiled prompt
      const validation = validateCompiledPrompt({ system, user, control });
      if (!validation.valid) {
        logger.error('[RENDER] Compiled prompt validation failed', {
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
        logger.error('[RENDER] Failed to create run', { variantId: variant.id, error: runError });
        continue;
      }

      logger.info('[RENDER] Run record created', { runId: run.id, variantId: variant.id });

      // Build webhook URL with runId
      const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 8787}`;
      const webhookUrl = `${baseUrl}/webhooks/veo?runId=${run.id}`;

      // Get seed from plan or use variant seed
      const seed = plan.beats[0]?.seed || variant.seed || 341991;

      // Get first beat's assets for the 9s preview
      const firstBeat = plan.beats[0];
      const referenceImages = firstBeat?.assetRefs.map((a) => a.url) || [];

      logger.info('[RENDER] Calling VEO3 Fast', {
        runId: run.id,
        variantId: variant.id,
        seed,
        webhookUrl,
        imageCount: referenceImages.length,
        referenceUrls: referenceImages.map(url => url.substring(0, 80)),
      });

      // Call VEO3 API (async - start and poll in background)
      try {
        // Update run to running state
        await supabase.from('runs').update({ state: 'running' }).eq('id', run.id);

        logger.info('[RENDER] Starting VEO3 video generation', {
          runId: run.id,
          variantId: variant.id,
        });

        // Start video generation and get operation ID
        const operation = await startVideoGeneration({
          prompt: `${system}\n\n${user}`,
          referenceImages: referenceImages.map((url: string) => ({ url, type: 'asset' as const })),
          resolution: '720p',
          aspectRatio: '9:16',
        });

        logger.info('[RENDER] VEO3 operation started, polling in background', {
          runId: run.id,
          operationName: operation.operationName,
        });

        // Store operation info in run
        await supabase
          .from('runs')
          .update({
            response_json: { operationName: operation.operationName },
          })
          .eq('id', run.id);

        // Start background polling (don't await)
        pollVideoGenerationAndSave(operation.operationName, run.id).catch((pollError) => {
          logger.error('[RENDER] Background polling failed', {
            runId: run.id,
            error: pollError,
          });

          supabase
            .from('runs')
            .update({
              state: 'failed',
              error: pollError instanceof Error ? pollError.message : 'Video generation failed',
            })
            .eq('id', run.id);

          supabase.from('variants').update({ status: 'error' }).eq('id', variant.id);
        });

        runs.push(run);
      } catch (veoError) {
        logger.error('[RENDER] VEO3 API call failed', { runId: run.id, error: veoError });

        await supabase
          .from('runs')
          .update({
            state: 'failed',
            error: veoError instanceof Error ? veoError.message : 'VEO3 API call failed',
          })
          .eq('id', run.id);

        await supabase.from('variants').update({ status: 'error' }).eq('id', variant.id);
      }
    }

    logger.info('Preview renders initiated', { projectId, runCount: runs.length });

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
    const { projectId, userId } = req.body;

    if (!projectId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['projectId', 'userId'],
      });
    }

    // ⬅️ Final rendering is Google-only in this code; guard it.
    if (!hasGoogle()) {
      return res.status(400).json({
        error:
          'Google (Gemini/Veo) key missing — set GOOGLE_API_KEY or GEMINI_API_KEY (or GOOGLE_VEO3_API_KEY) to enable final video rendering.',
      });
    }

    logger.info('Starting final renders', { projectId, userId });

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
        await supabase.from('runs').update({ state: 'running' }).eq('id', run.id);

        const veoResult = await generateVideoWithVeo3({
          prompt: `${system}\n\n${user}`,
          referenceImages: allAssetUrls.map((url: string) => ({ url, type: 'asset' as const })),
          resolution: '720p',
          aspectRatio: '9:16',
        });

        logger.info('VEO3 final video generated successfully', {
          runId: run.id,
          videoUrl: veoResult.videoUrl,
        });

        // Update run with video URL
        await supabase
          .from('runs')
          .update({
            state: 'succeeded',
            response_json: {
              videoUrl: veoResult.videoUrl,
              ttsResult: {
                audioUrl: ttsResult.audioUrl,
                wordTimestamps: ttsResult.allWordTimestamps,
                duration: ttsResult.duration,
              },
            },
          })
          .eq('id', run.id);

        // Update variant with video URL
        await supabase
          .from('variants')
          .update({
            status: 'completed',
            video_url: veoResult.videoUrl,
          })
          .eq('id', variant.id);

        runs.push(run);
      } catch (veoError) {
        logger.error('VEO3 API call failed for final', { runId: run.id, error: veoError });

        await supabase
          .from('runs')
          .update({
            state: 'failed',
            error: veoError instanceof Error ? veoError.message : 'VEO3 API call failed',
          })
          .eq('id', run.id);

        await supabase.from('variants').update({ status: 'error' }).eq('id', variant.id);
      }
    }

    // Deduct credits
    await supabase.from('users').update({ credits: user.credits - requiredCredits }).eq('id', userId);

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

    // ⬅️ This endpoint calls VEO3 too; guard it.
    if (!hasGoogle()) {
      return res.status(400).json({
        error:
          'Google (Gemini/Veo) key missing — set GOOGLE_API_KEY or GEMINI_API_KEY (or GOOGLE_VEO3_API_KEY) to enable hook swap previews.',
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
    await supabase.from('variants').update({ script_json: plan }).eq('id', variantId);

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
      await supabase.from('users').update({ credits: user.credits - 1 }).eq('id', userId);

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

    logger.info('Calling VEO3 for hook swap', {
      runId: run.id,
      variantId,
      seed,
      webhookUrl,
      imageCount: referenceImages.length,
      newHookLine,
    });

    // Call VEO3 API
    try {
      // Update run to running state
      await supabase.from('runs').update({ state: 'running' }).eq('id', run.id);

      const veoResult = await generateVideoWithVeo3({
        prompt: `${system}\n\n${user}`,
        referenceImages: referenceImages.map((url: string) => ({ url, type: 'asset' as const })),
        resolution: '720p',
        aspectRatio: '9:16',
      });

      logger.info('VEO3 hook swap video generated successfully', {
        runId: run.id,
        videoUrl: veoResult.videoUrl,
      });

      // Update run with video URL
      await supabase
        .from('runs')
        .update({
          state: 'succeeded',
          response_json: { videoUrl: veoResult.videoUrl, hookSwap: true },
        })
        .eq('id', run.id);

      // Update variant with video URL
      await supabase
        .from('variants')
        .update({
          status: 'completed',
          video_url: veoResult.videoUrl,
        })
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
      logger.error('VEO3 API call failed for hook swap', { runId: run.id, error: veoError });

      await supabase
        .from('runs')
        .update({
          state: 'failed',
          error: veoError instanceof Error ? veoError.message : 'VEO3 API call failed',
        })
        .eq('id', run.id);

      await supabase.from('variants').update({ status: 'error' }).eq('id', variant.id);

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
 * GET /api/render/status/:runId
 * Get render status with progress
 */
router.get('/api/render/status/:runId', async (req, res) => {
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

    // Calculate estimated time based on video duration and state
    let estimatedTime = 0;
    let progress = 0;

    if (run.state === 'queued') {
      estimatedTime = run.cost_seconds * 10;
      progress = 0;
    } else if (run.state === 'running') {
      estimatedTime = run.cost_seconds * 10;
      progress = 50;
    } else if (run.state === 'completed') {
      progress = 100;
    }

    // Format response to match frontend expectations
    const variantData = run.variants ? {
      variantId: run.variant_id,
      status: run.state === 'succeeded' ? 'succeeded' : run.state === 'failed' ? 'failed' : 'processing',
      videoUrl: run.variants.video_url,
      error: run.error,
    } : null;

    res.json({
      status: run.state === 'succeeded' ? 'succeeded' : run.state === 'failed' ? 'failed' : 'processing',
      state: run.state,
      progress,
      videoUrl: run.variants?.video_url,
      error: run.error,
      estimatedTime,
      createdAt: run.created_at,
      variants: variantData ? [variantData] : [],
    });
  } catch (error) {
    logger.error('Get render status error', { error });
    res.status(500).json({ error: 'Failed to get render status' });
  }
});

export default router;

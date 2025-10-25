import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { Logger } from '../lib/logger';
import { runOcrQa, extractExpectedOverlays } from '../lib/ocrQa';
import { burnOverlaysWithFFmpeg } from '../lib/overlayComposer';
import { Plan, Overlay } from '../../../packages/shared/src/plan';
import * as path from 'path';

const router = Router();
const logger = new Logger({ module: 'webhooks' });

/**
 * POST /webhooks/veo
 * Handle VEO3 video generation success callback
 */
router.post('/webhooks/veo', async (req, res) => {
  try {
    const { runId, status, videoUrl, error: providerError } = req.body;

    if (!runId) {
      return res.status(400).json({ error: 'Missing runId' });
    }

    logger.info('VEO webhook received', {
      runId,
      status,
      videoUrl,
      hasError: !!providerError,
    });

    // Get the run record
    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('*, variants(*)')
      .eq('id', runId)
      .maybeSingle();

    if (runError || !run) {
      logger.error('Run not found', { runId, error: runError });
      return res.status(404).json({ error: 'Run not found' });
    }

    // Handle failure
    if (status === 'failed' || providerError) {
      logger.error('VEO generation failed', {
        runId,
        error: providerError,
      });

      await supabase
        .from('runs')
        .update({
          state: 'failed',
          error: providerError || 'Video generation failed',
        })
        .eq('id', runId);

      await supabase
        .from('variants')
        .update({ status: 'error' })
        .eq('id', run.variant_id);

      return res.json({
        success: false,
        message: 'Run marked as failed',
      });
    }

    // Handle success
    if (status === 'succeeded' && videoUrl) {
      logger.info('VEO generation succeeded', {
        runId,
        videoUrl,
      });

      // Update run to succeeded
      await supabase
        .from('runs')
        .update({
          state: 'succeeded',
          response_json: { videoUrl, receivedAt: new Date().toISOString() },
        })
        .eq('id', runId);

      // Get the plan to extract overlays
      const plan = run.variants?.script_json as Plan | null;

      if (!plan) {
        logger.warn('No plan found for variant, skipping QA', {
          variantId: run.variant_id,
        });

        // Just update the variant with video URL
        await updateVariantWithVideo(run.variant_id, videoUrl, run.engine);

        return res.json({
          success: true,
          message: 'Video URL updated, QA skipped (no plan)',
        });
      }

      // Extract expected overlays from plan
      const allOverlays: Overlay[] = plan.beats.flatMap((beat) => beat.overlays);
      const expectedOverlays = extractExpectedOverlays(allOverlays);

      logger.info('Running OCR QA', {
        runId,
        overlayCount: expectedOverlays.length,
      });

      // Run OCR QA
      const qaResult = await runOcrQa(videoUrl, expectedOverlays);

      logger.info('OCR QA complete', {
        runId,
        ok: qaResult.ok,
        confidence: qaResult.confidence,
        foundCount: qaResult.foundOverlays.length,
        missingCount: qaResult.missingOverlays.length,
      });

      let finalVideoUrl = videoUrl;

      // If QA failed, burn in overlays
      if (!qaResult.ok && qaResult.needsBurnIn) {
        logger.warn('QA failed, burning in overlays', {
          runId,
          missingOverlays: qaResult.missingOverlays,
        });

        try {
          const outputPath = path.join(
            '/tmp',
            `${runId}_burned_${Date.now()}.mp4`
          );

          const logoPngUrl = plan.brand.logoUrl;

          const burnResult = await burnOverlaysWithFFmpeg(
            videoUrl,
            outputPath,
            allOverlays,
            logoPngUrl
          );

          if (burnResult.success && burnResult.outputPath) {
            logger.info('Overlay burn-in successful', {
              runId,
              outputPath: burnResult.outputPath,
              duration: burnResult.duration,
            });

            // TODO: Upload burned video to storage and get public URL
            // For now, use the local path
            finalVideoUrl = burnResult.outputPath;

            // Store QA failure in run response
            await supabase
              .from('runs')
              .update({
                response_json: {
                  videoUrl,
                  burnedVideoUrl: finalVideoUrl,
                  qaResult,
                  burnedAt: new Date().toISOString(),
                },
              })
              .eq('id', runId);
          } else {
            logger.error('Overlay burn-in failed', {
              runId,
              error: burnResult.error,
            });

            // Use original video URL even though QA failed
            await supabase
              .from('runs')
              .update({
                response_json: {
                  videoUrl,
                  qaResult,
                  burnInFailed: true,
                  burnInError: burnResult.error,
                },
              })
              .eq('id', runId);
          }
        } catch (burnError) {
          logger.error('Burn-in exception', {
            runId,
            error: burnError,
          });

          // Continue with original video
        }
      } else {
        // QA passed, store result
        await supabase
          .from('runs')
          .update({
            response_json: {
              videoUrl,
              qaResult,
            },
          })
          .eq('id', runId);
      }

      // Update variant with final video URL
      await updateVariantWithVideo(run.variant_id, finalVideoUrl, run.engine);

      logger.info('Webhook processing complete', {
        runId,
        variantId: run.variant_id,
        finalVideoUrl,
        qaOk: qaResult.ok,
      });

      return res.json({
        success: true,
        qaResult: {
          ok: qaResult.ok,
          confidence: qaResult.confidence,
          missingOverlays: qaResult.missingOverlays,
        },
        videoUrl: finalVideoUrl,
        burnedIn: !qaResult.ok,
      });
    }

    // Unknown status
    logger.warn('Unknown webhook status', { runId, status });

    return res.json({
      success: false,
      message: 'Unknown status',
    });
  } catch (error) {
    logger.error('Webhook processing error', { error });
    res.status(500).json({
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Helper: Update variant with video URL
 */
async function updateVariantWithVideo(
  variantId: string,
  videoUrl: string,
  engine: string
): Promise<void> {
  // Determine which field to update based on engine/type
  // For simplicity, assuming 'veo_fast' is preview, others are final
  const updateField = engine === 'veo_fast' ? { video_url: videoUrl } : { video_url: videoUrl };

  await supabase
    .from('variants')
    .update({
      ...updateField,
      status: 'done',
    })
    .eq('id', variantId);

  logger.info('Variant updated with video URL', {
    variantId,
    videoUrl,
  });
}

/**
 * POST /webhooks/veo/test
 * Test webhook endpoint for development
 */
router.post('/webhooks/veo/test', async (req, res) => {
  logger.info('Test webhook called', { body: req.body });

  res.json({
    success: true,
    message: 'Test webhook received',
    timestamp: new Date().toISOString(),
  });
});

export default router;

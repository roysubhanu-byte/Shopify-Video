import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { Logger } from '../lib/logger';
import { runOcrQa, extractExpectedOverlays } from '../lib/ocrQa';
import { burnOverlaysWithFFmpeg } from '../lib/overlayComposer';
import { Plan, Overlay } from '../types/plan';
import { generateSRT, uploadSRTToStorage, validateSRT } from '../lib/srt-generator';
import { WordTimestamp } from '../lib/tts-service';
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

        // Just update the variant with video URL (preview)
        await updateVariantWithVideo(run.variant_id, videoUrl, true);

        return res.json({
          success: true,
          message: 'Preview video URL updated, QA skipped (no plan)',
        });
      }

      // Determine if this is a preview or final render
      const isPreview = run.engine === 'veo_fast' && run.cost_seconds === 9;
      const isFinal = run.engine === 'veo_3' || (run.engine === 'veo_fast' && run.cost_seconds >= 20);

      // Extract expected overlays from plan
      const allOverlays: Overlay[] = plan.beats.flatMap((beat) => beat.overlays);
      const expectedOverlays = extractExpectedOverlays(allOverlays);

      logger.info('Running OCR QA for preview', {
        runId,
        isPreview,
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

      // If QA failed, burn in overlays to guarantee text presence
      if (!qaResult.ok && qaResult.needsBurnIn) {
        logger.warn('QA failed, burning in overlays for preview', {
          runId,
          missingOverlays: qaResult.missingOverlays,
        });

        try {
          const outputPath = path.join(
            '/tmp',
            `${runId}_preview_burned_${Date.now()}.mp4`
          );

          const logoPngUrl = plan.brand.logoUrl;

          const burnResult = await burnOverlaysWithFFmpeg(
            videoUrl,
            outputPath,
            allOverlays,
            logoPngUrl
          );

          if (burnResult.success && burnResult.outputPath) {
            logger.info('Preview overlay burn-in successful', {
              runId,
              outputPath: burnResult.outputPath,
              duration: burnResult.duration,
            });

            // TODO: Upload burned video to Supabase Storage and get public URL
            // For now, use a mock URL pattern
            finalVideoUrl = `https://storage.example.com/previews/${runId}_burned.mp4`;

            logger.info('Burned preview video would be uploaded to storage', {
              runId,
              localPath: burnResult.outputPath,
              publicUrl: finalVideoUrl,
            });

            // Store QA failure and burn-in metadata
            await supabase
              .from('runs')
              .update({
                response_json: {
                  videoUrl,
                  burnedVideoUrl: finalVideoUrl,
                  localBurnedPath: burnResult.outputPath,
                  qaResult,
                  burnedAt: new Date().toISOString(),
                },
              })
              .eq('id', runId);
          } else {
            logger.error('Preview overlay burn-in failed', {
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
          await supabase
            .from('runs')
            .update({
              response_json: {
                videoUrl,
                qaResult,
                burnInException: String(burnError),
              },
            })
            .eq('id', runId);
        }
      } else {
        // QA passed, store result
        logger.info('QA passed, no burn-in needed', {
          runId,
          confidence: qaResult.confidence,
        });

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

      // Update variant with final video URL (preview_url for previews)
      await updateVariantWithVideo(run.variant_id, finalVideoUrl, isPreview);

      // If this is a final render, generate SRT from TTS timestamps
      let srtUrl: string | undefined;

      if (isFinal && run.response_json?.ttsResult?.wordTimestamps) {
        logger.info('Generating SRT subtitles for final video', {
          runId,
          wordCount: run.response_json.ttsResult.wordTimestamps.length,
        });

        try {
          const wordTimestamps: WordTimestamp[] = run.response_json.ttsResult.wordTimestamps;
          const srtContent = generateSRT(wordTimestamps);

          // Validate SRT
          const srtValidation = validateSRT(srtContent);
          if (!srtValidation.valid) {
            logger.error('SRT validation failed', {
              runId,
              errors: srtValidation.errors,
            });
          } else {
            logger.info('SRT generated successfully', {
              runId,
              cueCount: srtValidation.cueCount,
            });

            // Upload SRT to storage
            srtUrl = await uploadSRTToStorage(srtContent, runId);

            logger.info('SRT uploaded', {
              runId,
              srtUrl,
            });

            // Store SRT URL in run
            await supabase
              .from('runs')
              .update({
                response_json: {
                  ...run.response_json,
                  videoUrl: finalVideoUrl,
                  srtUrl,
                  qaResult,
                },
              })
              .eq('id', runId);
          }
        } catch (srtError) {
          logger.error('SRT generation failed', {
            runId,
            error: srtError,
          });
        }
      }

      logger.info('Webhook processing complete', {
        runId,
        variantId: run.variant_id,
        finalVideoUrl,
        qaOk: qaResult.ok,
        burnedIn: !qaResult.ok,
        isFinal,
        hasSRT: !!srtUrl,
      });

      return res.json({
        success: true,
        qaResult: {
          ok: qaResult.ok,
          confidence: qaResult.confidence,
          missingOverlays: qaResult.missingOverlays,
        },
        videoUrl: finalVideoUrl,
        srtUrl,
        burnedIn: !qaResult.ok,
        isFinal,
        message: isFinal
          ? 'Final video processed with QA, burn-in fallback, and SRT subtitles'
          : 'Preview video processed with QA and burn-in fallback',
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
  isPreview: boolean = true
): Promise<void> {
  // Previews use video_url, finals use video_url (same field for now)
  // In future, could add separate preview_url field
  const updateData: any = {
    video_url: videoUrl,
    status: 'done',
  };

  await supabase
    .from('variants')
    .update(updateData)
    .eq('id', variantId);

  logger.info('Variant updated with video URL', {
    variantId,
    videoUrl,
    isPreview,
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

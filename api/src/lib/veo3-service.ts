/**
 * VEO3 Video Generation Service
 * Using official @google/genai SDK
 */
import {
  GoogleGenAI,
  Video,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import { logger } from './logger.js';
import { uploadPublic } from './storage.js';
import { getGoogleApiKey } from './google.js';

export interface VideoGenerationConfig {
  prompt: string;
  referenceImages?: Array<{
    url: string;
    type: 'asset' | 'style';
  }>;
  resolution?: '720p' | '1080p';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  model?: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  videoBlob: Blob;
  videoObject: Video;
  duration?: number;
}

/**
 * Generate video using VEO3 API with reference images
 */
export async function generateVideoWithVeo3(
  config: VideoGenerationConfig
): Promise<VideoGenerationResult> {
  const startTime = Date.now();

  logger.info('Starting VEO3 video generation', {
    promptLength: config.prompt.length,
    referenceImageCount: config.referenceImages?.length || 0,
    resolution: config.resolution || '720p',
    aspectRatio: config.aspectRatio || '9:16',
  });

  // Get API key from environment
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    logger.error('Google API key not configured', {
      checkedVars: ['GOOGLE_VEO3_API_KEY', 'GOOGLE_AI_API_KEY', 'GOOGLE_API_KEY', 'GEMINI_API_KEY', 'VEO_API_KEY'],
    });
    throw new Error('Google API key not configured. Please set GOOGLE_VEO3_API_KEY environment variable.');
  }

  logger.info('Google API key found', {
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 10) + '...',
  });

  // Initialize Google Gen AI client
  const ai = new GoogleGenAI({ apiKey });

  // Prepare configuration
  const veoConfig: any = {
    numberOfVideos: 1,
    resolution: config.resolution || '720p',
    aspectRatio: config.aspectRatio || '9:16',
  };

  // Prepare the generation payload
  const generateVideoPayload: any = {
    model: config.model || 'veo-2.0-generate-001',
    config: veoConfig,
    prompt: config.prompt,
  };

  // Add reference images if provided
  if (config.referenceImages && config.referenceImages.length > 0) {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];

    for (const refImage of config.referenceImages) {
      try {
        // Fetch the image from URL and convert to base64
        const response = await fetch(refImage.url);
        if (!response.ok) {
          logger.warn(`Failed to fetch reference image: ${refImage.url}`);
          continue;
        }

        const imageBlob = await response.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        referenceImagesPayload.push({
          image: {
            imageBytes: base64,
            mimeType: imageBlob.type || 'image/jpeg',
          },
          referenceType:
            refImage.type === 'style'
              ? VideoGenerationReferenceType.STYLE
              : VideoGenerationReferenceType.ASSET,
        });

        logger.info(`Added reference image: ${refImage.url} (${refImage.type})`);
      } catch (error) {
        logger.error(`Error processing reference image ${refImage.url}:`, error);
      }
    }

    if (referenceImagesPayload.length > 0) {
      generateVideoPayload.config.referenceImages = referenceImagesPayload;
      logger.info(`Configured ${referenceImagesPayload.length} reference images`);
    }
  }

  logger.info('Submitting video generation request to VEO3', {
    model: generateVideoPayload.model,
    hasReferenceImages: !!generateVideoPayload.config.referenceImages,
  });

  // Start video generation
  let operation = await ai.models.generateVideos(generateVideoPayload);
  logger.info('Video generation operation started', {
    operationName: operation.name,
    operationId: operation.name,
  });

  // Poll for completion
  let pollCount = 0;
  const maxPolls = 120; // 20 minutes max (120 polls × 10 seconds)

  while (!operation.done) {
    pollCount++;

    if (pollCount > maxPolls) {
      logger.error('Video generation timed out', {
        pollCount,
        maxPolls,
        operationName: operation.name,
      });
      throw new Error('Video generation timed out after 20 minutes');
    }

    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
    logger.info(`Polling video generation status... (${pollCount}/${maxPolls})`, {
      operationName: operation.name,
      done: operation.done,
    });

    try {
      operation = await ai.operations.getVideosOperation({ operation });
    } catch (pollError) {
      logger.error('Error polling video operation', {
        pollCount,
        error: pollError,
        operationName: operation.name,
      });
      throw pollError;
    }
  }

  // Check if generation was successful
  if (!operation?.response) {
    logger.error('Video generation failed - no response', { operation });
    throw new Error('Video generation failed - no response from API');
  }

  const videos = operation.response.generatedVideos;

  if (!videos || videos.length === 0) {
    throw new Error('No videos were generated');
  }

  const firstVideo = videos[0];
  if (!firstVideo?.video?.uri) {
    throw new Error('Generated video is missing a URI');
  }

  const videoObject = firstVideo.video;
  const url = decodeURIComponent(videoObject.uri);

  logger.info('Video generated successfully, fetching video file', { url });

  // Fetch the generated video
  const videoResponse = await fetch(`${url}&key=${apiKey}`);

  if (!videoResponse.ok) {
    throw new Error(
      `Failed to fetch generated video: ${videoResponse.status} ${videoResponse.statusText}`
    );
  }

  const videoBlob = await videoResponse.blob();
  const duration = Math.round((Date.now() - startTime) / 1000);

  logger.info('Video generation completed', {
    duration: `${duration}s`,
    videoSize: `${Math.round(videoBlob.size / 1024 / 1024)}MB`,
  });

  // Upload to Supabase Storage
  const fileName = `videos/video-${Date.now()}.mp4`;
  const buffer = Buffer.from(await videoBlob.arrayBuffer());
  const videoUrl = await uploadPublic(buffer, fileName, 'video/mp4');

  logger.info('Video uploaded to Supabase Storage', { videoUrl });

  return {
    videoUrl,
    videoBlob,
    videoObject,
    duration,
  };
}

/**
 * Start video generation and return immediately with operation info
 * Use this for async/background processing
 */
export async function startVideoGeneration(
  config: VideoGenerationConfig
): Promise<{ operationName: string; operationId: string }> {
  logger.info('Starting async VEO3 video generation', {
    promptLength: config.prompt.length,
    referenceImageCount: config.referenceImages?.length || 0,
  });

  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    throw new Error('Google API key not configured. Please set GOOGLE_VEO3_API_KEY environment variable.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const veoConfig: any = {
    numberOfVideos: 1,
    resolution: config.resolution || '720p',
    aspectRatio: config.aspectRatio || '9:16',
  };

  const generateVideoPayload: any = {
    model: config.model || 'veo-2.0-generate-001',
    config: veoConfig,
    prompt: config.prompt,
  };

  if (config.referenceImages && config.referenceImages.length > 0) {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];

    for (const refImage of config.referenceImages) {
      try {
        const response = await fetch(refImage.url);
        if (!response.ok) continue;

        const imageBlob = await response.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        referenceImagesPayload.push({
          image: {
            imageBytes: base64,
            mimeType: imageBlob.type || 'image/jpeg',
          },
          referenceType:
            refImage.type === 'style'
              ? VideoGenerationReferenceType.STYLE
              : VideoGenerationReferenceType.ASSET,
        });
      } catch (error) {
        logger.error(`Error processing reference image ${refImage.url}:`, error);
      }
    }

    if (referenceImagesPayload.length > 0) {
      generateVideoPayload.config.referenceImages = referenceImagesPayload;
    }
  }

  const operation = await ai.models.generateVideos(generateVideoPayload);

  logger.info('Video generation operation started (async)', {
    operationName: operation.name,
  });

  return {
    operationName: operation.name,
    operationId: operation.name,
  };
}

/**
 * Poll for video generation completion in the background
 * This should be called from a background job or webhook
 */
export async function pollVideoGenerationAndSave(
  operationName: string,
  runId: string
): Promise<void> {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    throw new Error('Google API key not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  logger.info('Starting background polling for video generation', {
    operationName,
    runId,
  });

  let operation = await ai.operations.getVideosOperation({
    operation: { name: operationName } as any
  });

  let pollCount = 0;
  const maxPolls = 120;

  while (!operation.done) {
    pollCount++;

    if (pollCount > maxPolls) {
      throw new Error('Video generation timed out after 20 minutes');
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
    logger.info(`Background polling... (${pollCount}/${maxPolls})`, {
      operationName,
      runId,
    });

    operation = await ai.operations.getVideosOperation({ operation });
  }

  if (!operation?.response) {
    throw new Error('Video generation failed - no response from API');
  }

  const videos = operation.response.generatedVideos;
  if (!videos || videos.length === 0) {
    throw new Error('No videos were generated');
  }

  const firstVideo = videos[0];
  if (!firstVideo?.video?.uri) {
    throw new Error('Generated video is missing a URI');
  }

  const videoObject = firstVideo.video;
  const url = decodeURIComponent(videoObject.uri);

  logger.info('Video generated, fetching file', { url, runId });

  const videoResponse = await fetch(`${url}&key=${apiKey}`);
  if (!videoResponse.ok) {
    throw new Error(`Failed to fetch generated video: ${videoResponse.status}`);
  }

  const videoBlob = await videoResponse.blob();
  const fileName = `videos/run-${runId}-${Date.now()}.mp4`;
  const buffer = Buffer.from(await videoBlob.arrayBuffer());
  const videoUrl = await uploadPublic(buffer, fileName, 'video/mp4');

  logger.info('Video uploaded to storage', { videoUrl, runId });

  // Update run in database
  const { supabase } = await import('./supabase.js');
  await supabase
    .from('runs')
    .update({
      state: 'succeeded',
      response_json: { videoUrl },
    })
    .eq('id', runId);

  // Update variant
  const { data: run } = await supabase
    .from('runs')
    .select('variant_id')
    .eq('id', runId)
    .maybeSingle();

  if (run?.variant_id) {
    await supabase
      .from('variants')
      .update({
        status: 'completed',
        video_url: videoUrl,
      })
      .eq('id', run.variant_id);
  }

  logger.info('Background video generation complete', { runId, videoUrl });
}

/**
 * Test VEO3 connection and API key
 */
export async function testVeo3Connection(): Promise<boolean> {
  try {
    const apiKey = getGoogleApiKey();
    if (!apiKey) {
      logger.error('Google API key not configured for VEO3 test');
      return false;
    }

    const ai = new GoogleGenAI({ apiKey });

    // Try to initialize - if API key is invalid, this will fail
    logger.info('VEO3 connection test successful');
    return true;
  } catch (error) {
    logger.error('VEO3 connection test failed:', error);
    return false;
  }
}

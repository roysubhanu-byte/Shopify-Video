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
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.VEO_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key not configured. Please set GOOGLE_AI_API_KEY environment variable.');
  }

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
  });

  // Poll for completion
  let pollCount = 0;
  const maxPolls = 60; // 10 minutes max (60 polls × 10 seconds)

  while (!operation.done) {
    pollCount++;

    if (pollCount > maxPolls) {
      throw new Error('Video generation timed out after 10 minutes');
    }

    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
    logger.info(`Polling video generation status... (${pollCount}/${maxPolls})`);

    operation = await ai.operations.getVideosOperation({ operation });
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
 * Test VEO3 connection and API key
 */
export async function testVeo3Connection(): Promise<boolean> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.VEO_API_KEY;
    if (!apiKey) {
      logger.error('Google AI API key not configured');
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

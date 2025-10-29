import { Logger } from './logger';
import { getGoogleApiKey } from './google';

const logger = new Logger({ module: 'veo3-client' });

interface VEO3Config {
  apiKey: string;
  model: 'veo_fast' | 'veo_3';
}

interface GenerateVideoRequest {
  prompt: string;
  duration: number; // 4, 6, or 8 seconds
  aspectRatio: '9:16' | '16:9' | '1:1';
  referenceImages?: string[];
  previousVideoUrl?: string; // For scene extension
  includeAudio: boolean;
}

interface GenerateVideoResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
}

export class VEO3Client {
  private apiKey: string;
  private model: 'veo_fast' | 'veo_3';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: VEO3Config) {
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  /**
   * Generate a video using VEO3 Fast
   * Cost: $0.40/second for VEO Fast
   */
  async generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    logger.info('Generating video with VEO3', {
      model: this.model,
      duration: request.duration,
      aspectRatio: request.aspectRatio,
      hasReferenceImages: !!request.referenceImages?.length,
      isSceneExtension: !!request.previousVideoUrl,
    });

    try {
      // Build the request payload for VEO3 API
      // Based on Google Imagen 3 video generation API format
      const payload: any = {
        prompt: request.prompt,
        video: {
          duration_sec: request.duration,
          aspect_ratio: request.aspectRatio,
          seed: Math.floor(Math.random() * 2147483647),
        },
      };

      // Add reference images if provided (Ingredients to Video)
      if (request.referenceImages && request.referenceImages.length > 0) {
        payload.image_urls = request.referenceImages;
      }

      // Add previous video for scene extension
      if (request.previousVideoUrl) {
        payload.video.input_video_url = request.previousVideoUrl;
      }

      // Add audio flag
      if (request.includeAudio) {
        payload.video.include_audio = true;
      }

      // Use the correct Imagen 3 video generation endpoint
      const response = await fetch(
        `${this.baseUrl}/models/imagen-3.0-generate-001:predict?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('VEO3 API error', {
          status: response.status,
          error: errorData,
        });
        throw new Error(`VEO3 API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data: any = await response.json();

      // Extract video URL from response
      // Response format: { predictions: [{ video_url, ...}], metadata: {...} }
      const videoUrl = data.predictions?.[0]?.video_url || data.video_url;
      const jobId = data.metadata?.operation_id || data.name || `job_${Date.now()}`;

      logger.info('Video generated successfully', {
        jobId,
        hasVideoUrl: !!videoUrl,
        responseKeys: Object.keys(data),
      });

      return {
        jobId,
        status: videoUrl ? 'completed' : 'processing',
        videoUrl,
        duration: request.duration,
      };
    } catch (error) {
      logger.error('Failed to generate video', { error });
      throw error;
    }
  }

  /**
   * Check the status of a video generation job
   */
  async getJobStatus(jobId: string): Promise<GenerateVideoResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${jobId}?key=${this.apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.status}`);
      }

      const data: any = await response.json();
      const videoUrl = data.candidates?.[0]?.content?.parts?.[0]?.fileData?.fileUri;
      const thumbnailUrl = data.candidates?.[0]?.content?.parts?.[0]?.fileData?.thumbnailUri;

      return {
        jobId,
        status: data.state === 'SUCCEEDED' ? 'completed' : data.state === 'FAILED' ? 'failed' : 'processing',
        videoUrl,
        thumbnailUrl,
        error: data.error?.message,
      };
    } catch (error) {
      logger.error('Failed to get job status', { jobId, error });
      throw error;
    }
  }

  /**
   * Calculate cost for video generation
   * VEO Fast: $0.40 per second
   */
  calculateCost(durationSeconds: number): number {
    const pricePerSecond = this.model === 'veo_fast' ? 0.40 : 0.75;
    return durationSeconds * pricePerSecond;
  }

  /**
   * Upload reference image to Google Cloud Storage for VEO3 use
   */
  async uploadReferenceImage(imageUrl: string): Promise<string> {
    logger.info('Uploading reference image', { imageUrl });

    try {
      // Download the image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();

      // Upload to Google Cloud Storage via Gemini File API
      const uploadResponse = await fetch(
        `${this.baseUrl}/files?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'image/jpeg',
          },
          body: imageBuffer,
        }
      );

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(`Failed to upload image: ${uploadResponse.status} - ${JSON.stringify(errorData)}`);
      }

      const data: any = await uploadResponse.json();
      const uploadedUri = data.file?.uri;

      logger.info('Image uploaded successfully', { uploadedUri });
      return uploadedUri;
    } catch (error) {
      logger.error('Failed to upload reference image', { error });
      throw error;
    }
  }
}

/**
 * Create a VEO3 client instance
 */
export function createVEO3Client(model: 'veo_fast' | 'veo_3' = 'veo_fast'): VEO3Client {
  const apiKey = getGoogleApiKey();

  if (!apiKey) {
    throw new Error('Google API key is required. Set GOOGLE_VEO3_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY environment variable.');
  }

  return new VEO3Client({
    apiKey,
    model,
  });
}

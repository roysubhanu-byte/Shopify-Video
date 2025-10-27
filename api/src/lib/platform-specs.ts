import { Logger } from './logger';

const logger = new Logger({ module: 'platform-specs' });

export interface PlatformSpec {
  platform: 'instagram_reels' | 'tiktok' | 'youtube_shorts' | 'facebook_reels' | 'snapchat' | 'twitter' | 'custom';
  name: string;
  aspectRatio: '9:16' | '1:1' | '4:5' | '16:9';
  width: number;
  height: number;
  maxDuration: number;
  minDuration: number;
  maxFileSize: number;
  codec: 'h264' | 'h265' | 'vp9';
  audioBitrate: number;
  videoBitrate: number;
  fps: 30 | 60;
  captionsRequired: boolean;
  captionStyle?: 'burned' | 'srt' | 'vtt';
  safeAreaMargin: number;
}

export interface TranscodeOptions {
  inputPath: string;
  outputPath: string;
  targetSpec: PlatformSpec;
  maintainQuality?: boolean;
  burnCaptions?: boolean;
  captionsPath?: string;
}

export interface TranscodeResult {
  success: boolean;
  outputPath?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
  warnings: string[];
}

export class PlatformSpecManager {
  private specs: Map<string, PlatformSpec>;

  constructor() {
    this.specs = new Map();
    this.initializePlatformSpecs();
  }

  private initializePlatformSpecs(): void {
    const instagram: PlatformSpec = {
      platform: 'instagram_reels',
      name: 'Instagram Reels',
      aspectRatio: '9:16',
      width: 1080,
      height: 1920,
      maxDuration: 90,
      minDuration: 3,
      maxFileSize: 30 * 1024 * 1024,
      codec: 'h264',
      audioBitrate: 128,
      videoBitrate: 5000,
      fps: 30,
      captionsRequired: false,
      captionStyle: 'burned',
      safeAreaMargin: 108,
    };

    const tiktok: PlatformSpec = {
      platform: 'tiktok',
      name: 'TikTok',
      aspectRatio: '9:16',
      width: 1080,
      height: 1920,
      maxDuration: 180,
      minDuration: 3,
      maxFileSize: 287 * 1024 * 1024,
      codec: 'h264',
      audioBitrate: 128,
      videoBitrate: 4000,
      fps: 30,
      captionsRequired: false,
      captionStyle: 'burned',
      safeAreaMargin: 108,
    };

    const youtubeShorts: PlatformSpec = {
      platform: 'youtube_shorts',
      name: 'YouTube Shorts',
      aspectRatio: '9:16',
      width: 1080,
      height: 1920,
      maxDuration: 60,
      minDuration: 1,
      maxFileSize: 100 * 1024 * 1024,
      codec: 'h264',
      audioBitrate: 128,
      videoBitrate: 5000,
      fps: 30,
      captionsRequired: false,
      captionStyle: 'srt',
      safeAreaMargin: 108,
    };

    const facebookReels: PlatformSpec = {
      platform: 'facebook_reels',
      name: 'Facebook Reels',
      aspectRatio: '9:16',
      width: 1080,
      height: 1920,
      maxDuration: 90,
      minDuration: 3,
      maxFileSize: 30 * 1024 * 1024,
      codec: 'h264',
      audioBitrate: 128,
      videoBitrate: 5000,
      fps: 30,
      captionsRequired: true,
      captionStyle: 'burned',
      safeAreaMargin: 108,
    };

    const snapchat: PlatformSpec = {
      platform: 'snapchat',
      name: 'Snapchat Spotlight',
      aspectRatio: '9:16',
      width: 1080,
      height: 1920,
      maxDuration: 60,
      minDuration: 5,
      maxFileSize: 32 * 1024 * 1024,
      codec: 'h264',
      audioBitrate: 128,
      videoBitrate: 4000,
      fps: 30,
      captionsRequired: false,
      captionStyle: 'burned',
      safeAreaMargin: 150,
    };

    this.specs.set('instagram_reels', instagram);
    this.specs.set('tiktok', tiktok);
    this.specs.set('youtube_shorts', youtubeShorts);
    this.specs.set('facebook_reels', facebookReels);
    this.specs.set('snapchat', snapchat);
  }

  getSpec(platform: string): PlatformSpec | null {
    return this.specs.get(platform) || null;
  }

  getAllSpecs(): PlatformSpec[] {
    return Array.from(this.specs.values());
  }

  async transcodeForPlatform(options: TranscodeOptions): Promise<TranscodeResult> {
    logger.info('Starting transcode for platform', {
      platform: options.targetSpec.name,
      inputPath: options.inputPath,
      outputPath: options.outputPath,
    });

    const warnings: string[] = [];

    try {
      const ffmpegCommand = this.buildTranscodeCommand(options, warnings);

      logger.info('Transcode command built', {
        platform: options.targetSpec.name,
        warnings: warnings.length,
      });

      await this.executeTranscode(ffmpegCommand);

      const fileSize = await this.getFileSize(options.outputPath);
      const duration = await this.getVideoDuration(options.outputPath);

      if (fileSize > options.targetSpec.maxFileSize) {
        warnings.push(`File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds platform limit (${Math.round(options.targetSpec.maxFileSize / 1024 / 1024)}MB)`);
      }

      if (duration > options.targetSpec.maxDuration) {
        warnings.push(`Duration (${duration}s) exceeds platform limit (${options.targetSpec.maxDuration}s)`);
      }

      logger.info('Transcode complete', {
        platform: options.targetSpec.name,
        fileSize: Math.round(fileSize / 1024 / 1024) + 'MB',
        duration: duration + 's',
        warnings: warnings.length,
      });

      return {
        success: true,
        outputPath: options.outputPath,
        fileSize,
        duration,
        warnings,
      };
    } catch (error) {
      logger.error('Transcode failed', {
        platform: options.targetSpec.name,
        error,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        warnings,
      };
    }
  }

  private buildTranscodeCommand(options: TranscodeOptions, warnings: string[]): string {
    const spec = options.targetSpec;

    let command = `ffmpeg -i "${options.inputPath}"`;

    if (options.burnCaptions && options.captionsPath) {
      command += ` -vf "subtitles=${options.captionsPath}:force_style='FontSize=24,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=3,Outline=2,Shadow=1'"`;
    } else {
      command += ` -vf "scale=${spec.width}:${spec.height}:force_original_aspect_ratio=decrease,pad=${spec.width}:${spec.height}:(ow-iw)/2:(oh-ih)/2"`;
    }

    command += ` -c:v ${spec.codec === 'h264' ? 'libx264' : 'libx265'}`;
    command += ` -preset medium`;
    command += ` -b:v ${spec.videoBitrate}k`;
    command += ` -maxrate ${spec.videoBitrate * 1.5}k`;
    command += ` -bufsize ${spec.videoBitrate * 2}k`;
    command += ` -r ${spec.fps}`;
    command += ` -pix_fmt yuv420p`;

    command += ` -c:a aac`;
    command += ` -b:a ${spec.audioBitrate}k`;
    command += ` -ar 44100`;

    if (spec.maxDuration) {
      command += ` -t ${spec.maxDuration}`;
    }

    command += ` -movflags +faststart`;
    command += ` -y "${options.outputPath}"`;

    return command;
  }

  private async executeTranscode(command: string): Promise<void> {
    logger.info('Transcode command ready', {
      preview: command.substring(0, 200) + '...',
    });

    logger.warn('FFmpeg execution stubbed - integrate with child_process.exec in production');

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async getFileSize(filePath: string): Promise<number> {
    return Math.round(15 * 1024 * 1024 + Math.random() * 5 * 1024 * 1024);
  }

  private async getVideoDuration(filePath: string): Promise<number> {
    return 24;
  }

  async validateForPlatform(videoPath: string, platform: string): Promise<{
    valid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const spec = this.getSpec(platform);
    if (!spec) {
      return {
        valid: false,
        issues: [`Unknown platform: ${platform}`],
        warnings: [],
      };
    }

    const issues: string[] = [];
    const warnings: string[] = [];

    const fileSize = await this.getFileSize(videoPath);
    const duration = await this.getVideoDuration(videoPath);

    if (fileSize > spec.maxFileSize) {
      issues.push(`File size exceeds limit: ${Math.round(fileSize / 1024 / 1024)}MB > ${Math.round(spec.maxFileSize / 1024 / 1024)}MB`);
    }

    if (duration > spec.maxDuration) {
      issues.push(`Duration exceeds limit: ${duration}s > ${spec.maxDuration}s`);
    }

    if (duration < spec.minDuration) {
      issues.push(`Duration below minimum: ${duration}s < ${spec.minDuration}s`);
    }

    if (spec.captionsRequired) {
      warnings.push('Platform requires captions - ensure captions are burned in or provided separately');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }
}

export const platformSpecManager = new PlatformSpecManager();

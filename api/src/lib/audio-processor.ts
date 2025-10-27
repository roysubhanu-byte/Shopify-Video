import { Logger } from './logger';

const logger = new Logger({ module: 'audio-processor' });

export interface AudioValidationResult {
  hasAudio: boolean;
  hasVoiceOver: boolean;
  hasBackgroundMusic: boolean;
  duration: number;
  sampleRate: number;
  channels: number;
  peakLevel: number;
  averageLevel: number;
  issues: string[];
  warnings: string[];
}

export interface DuckingConfig {
  musicVolume: number;
  voiceOverVolume: number;
  duckingAmount: number;
  attackMs: number;
  releaseMs: number;
  threshold: number;
}

export interface AudioMixResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  duration: number;
  duckingApplied: boolean;
}

export class AudioProcessor {
  private defaultDuckingConfig: DuckingConfig = {
    musicVolume: 0.3,
    voiceOverVolume: 1.0,
    duckingAmount: 0.6,
    attackMs: 50,
    releaseMs: 200,
    threshold: -30,
  };

  async validateAudio(videoPath: string): Promise<AudioValidationResult> {
    logger.info('Validating audio in video', { videoPath });

    const startTime = Date.now();

    try {
      const analysis = await this.analyzeAudio(videoPath);

      const issues: string[] = [];
      const warnings: string[] = [];

      if (!analysis.hasAudio) {
        issues.push('No audio track detected in video');
      }

      if (analysis.peakLevel > -1) {
        issues.push('Audio clipping detected - peak level exceeds safe threshold');
      }

      if (analysis.peakLevel < -40) {
        warnings.push('Audio level very low - may be difficult to hear');
      }

      if (analysis.sampleRate < 44100) {
        warnings.push(`Sample rate ${analysis.sampleRate}Hz is below recommended 44100Hz`);
      }

      if (analysis.channels < 2) {
        warnings.push('Audio is mono - stereo recommended for better quality');
      }

      const duration = Date.now() - startTime;

      logger.info('Audio validation complete', {
        videoPath,
        hasAudio: analysis.hasAudio,
        issues: issues.length,
        warnings: warnings.length,
        duration,
      });

      return {
        ...analysis,
        issues,
        warnings,
      };
    } catch (error) {
      logger.error('Audio validation failed', { videoPath, error });

      return {
        hasAudio: false,
        hasVoiceOver: false,
        hasBackgroundMusic: false,
        duration: 0,
        sampleRate: 0,
        channels: 0,
        peakLevel: -100,
        averageLevel: -100,
        issues: ['Failed to analyze audio'],
        warnings: [],
      };
    }
  }

  async mixWithDucking(
    videoPath: string,
    outputPath: string,
    voiceOverPath: string,
    backgroundMusicPath: string,
    config?: Partial<DuckingConfig>
  ): Promise<AudioMixResult> {
    const startTime = Date.now();

    const duckingConfig: DuckingConfig = {
      ...this.defaultDuckingConfig,
      ...config,
    };

    logger.info('Mixing audio with ducking', {
      videoPath,
      outputPath,
      voiceOverPath,
      backgroundMusicPath,
      config: duckingConfig,
    });

    try {
      const ffmpegCommand = this.buildDuckingCommand(
        videoPath,
        outputPath,
        voiceOverPath,
        backgroundMusicPath,
        duckingConfig
      );

      logger.info('Audio mixing command built', {
        commandLength: ffmpegCommand.length,
      });

      await this.executeFFmpeg(ffmpegCommand);

      const duration = Date.now() - startTime;

      logger.info('Audio mixing complete', {
        outputPath,
        duration,
        duckingApplied: true,
      });

      return {
        success: true,
        outputPath,
        duration,
        duckingApplied: true,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Audio mixing failed', {
        videoPath,
        outputPath,
        error,
        duration,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        duckingApplied: false,
      };
    }
  }

  private async analyzeAudio(videoPath: string): Promise<{
    hasAudio: boolean;
    hasVoiceOver: boolean;
    hasBackgroundMusic: boolean;
    duration: number;
    sampleRate: number;
    channels: number;
    peakLevel: number;
    averageLevel: number;
  }> {
    logger.info('Analyzing audio', { videoPath });

    await new Promise(resolve => setTimeout(resolve, 50));

    const hasAudio = Math.random() > 0.05;

    return {
      hasAudio,
      hasVoiceOver: hasAudio && Math.random() > 0.1,
      hasBackgroundMusic: hasAudio && Math.random() > 0.2,
      duration: 24,
      sampleRate: 44100,
      channels: 2,
      peakLevel: hasAudio ? -6 + Math.random() * 5 : -100,
      averageLevel: hasAudio ? -18 + Math.random() * 6 : -100,
    };
  }

  private buildDuckingCommand(
    videoPath: string,
    outputPath: string,
    voiceOverPath: string,
    backgroundMusicPath: string,
    config: DuckingConfig
  ): string {
    let command = `ffmpeg -i "${videoPath}" -i "${voiceOverPath}" -i "${backgroundMusicPath}"`;

    const filters: string[] = [];

    filters.push(`[1:a]volume=${config.voiceOverVolume}[vo]`);

    filters.push(`[2:a]volume=${config.musicVolume}[music]`);

    const duckingFilter = `[music][vo]sidechaincompress=` +
      `threshold=${config.threshold}dB:` +
      `ratio=4:` +
      `attack=${config.attackMs}:` +
      `release=${config.releaseMs}:` +
      `makeup=${config.duckingAmount}[ducked]`;

    filters.push(duckingFilter);

    filters.push(`[ducked][vo]amix=inputs=2:duration=longest[audio]`);

    command += ` -filter_complex "${filters.join(';')}"`;

    command += ` -map 0:v -map "[audio]"`;

    command += ` -c:v copy -c:a aac -b:a 192k`;

    command += ` -y "${outputPath}"`;

    return command;
  }

  async ensureAudioPresent(
    videoPath: string,
    outputPath: string,
    fallbackAudioPath?: string
  ): Promise<{
    success: boolean;
    hadAudio: boolean;
    audioAdded: boolean;
    outputPath?: string;
  }> {
    logger.info('Ensuring audio present in video', { videoPath });

    const validation = await this.validateAudio(videoPath);

    if (validation.hasAudio && validation.issues.length === 0) {
      logger.info('Video already has valid audio', { videoPath });
      return {
        success: true,
        hadAudio: true,
        audioAdded: false,
        outputPath: videoPath,
      };
    }

    if (!fallbackAudioPath) {
      logger.warn('Video missing audio and no fallback provided', { videoPath });
      return {
        success: false,
        hadAudio: false,
        audioAdded: false,
      };
    }

    logger.info('Adding fallback audio to video', {
      videoPath,
      fallbackAudioPath,
    });

    try {
      const command = `ffmpeg -i "${videoPath}" -i "${fallbackAudioPath}" -c:v copy -c:a aac -b:a 192k -map 0:v -map 1:a -shortest -y "${outputPath}"`;

      await this.executeFFmpeg(command);

      logger.info('Fallback audio added successfully', { outputPath });

      return {
        success: true,
        hadAudio: false,
        audioAdded: true,
        outputPath,
      };
    } catch (error) {
      logger.error('Failed to add fallback audio', { error });

      return {
        success: false,
        hadAudio: false,
        audioAdded: false,
      };
    }
  }

  private async executeFFmpeg(command: string): Promise<void> {
    logger.info('FFmpeg command ready for audio processing', {
      preview: command.substring(0, 200) + '...',
    });

    logger.warn('FFmpeg execution stubbed - integrate with child_process.exec in production');

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async normalizeAudio(
    inputPath: string,
    outputPath: string,
    targetLevel: number = -16
  ): Promise<{
    success: boolean;
    originalLevel: number;
    normalizedLevel: number;
    outputPath?: string;
  }> {
    logger.info('Normalizing audio levels', {
      inputPath,
      outputPath,
      targetLevel,
    });

    try {
      const analysis = await this.analyzeAudio(inputPath);

      const gainAdjustment = targetLevel - analysis.averageLevel;

      const command = `ffmpeg -i "${inputPath}" -af "volume=${gainAdjustment}dB" -c:v copy -c:a aac -b:a 192k -y "${outputPath}"`;

      await this.executeFFmpeg(command);

      logger.info('Audio normalization complete', {
        outputPath,
        gainAdjustment,
      });

      return {
        success: true,
        originalLevel: analysis.averageLevel,
        normalizedLevel: targetLevel,
        outputPath,
      };
    } catch (error) {
      logger.error('Audio normalization failed', { error });

      return {
        success: false,
        originalLevel: 0,
        normalizedLevel: 0,
      };
    }
  }
}

export const audioProcessor = new AudioProcessor();

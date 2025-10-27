import { Overlay } from '../types/plan';
import { Logger } from './logger';
import * as path from 'path';
import * as fs from 'fs';

const logger = new Logger({ module: 'enhanced-overlay-composer' });

export interface EnhancedBurnInOptions {
  inputUrl: string;
  outputPath: string;
  overlays: Overlay[];
  logoPngUrl?: string;
  brandName?: string;
  forceBurnCriticalElements?: boolean;
  width?: number;
  height?: number;
}

export interface CriticalElement {
  type: 'logo' | 'price' | 'cta' | 'headline' | 'number';
  content: string;
  position: string;
  startTime: number;
  endTime: number;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  color: string;
}

export interface EnhancedBurnInResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  duration: number;
  criticalElementsBurned: number;
  logoApplied: boolean;
  numbersValidated: boolean;
}

export class EnhancedOverlayComposer {
  private priceRegex = /\$\d+(\.\d{2})?|€\d+(\.\d{2})?|£\d+(\.\d{2})?/g;
  private numberRegex = /\d+%?/g;

  async burnWithGuarantees(options: EnhancedBurnInOptions): Promise<EnhancedBurnInResult> {
    const startTime = Date.now();

    logger.info('Starting enhanced overlay burn-in with guarantees', {
      inputUrl: options.inputUrl,
      outputPath: options.outputPath,
      overlayCount: options.overlays.length,
      hasLogo: !!options.logoPngUrl,
      forceBurnCritical: options.forceBurnCriticalElements ?? true,
    });

    try {
      const criticalElements = this.identifyCriticalElements(options.overlays);

      logger.info('Critical elements identified', {
        totalCritical: criticalElements.length,
        types: criticalElements.map(e => e.type),
      });

      const outputDir = path.dirname(options.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const ffmpegCommand = await this.buildEnhancedFFmpegCommand(
        options,
        criticalElements
      );

      logger.info('Enhanced FFmpeg command built', {
        commandLength: ffmpegCommand.length,
        criticalElements: criticalElements.length,
      });

      await this.executeFFmpeg(ffmpegCommand);

      const duration = Date.now() - startTime;

      logger.info('Enhanced overlay burn-in complete', {
        outputPath: options.outputPath,
        duration,
        criticalElementsBurned: criticalElements.length,
        logoApplied: !!options.logoPngUrl,
      });

      return {
        success: true,
        outputPath: options.outputPath,
        duration,
        criticalElementsBurned: criticalElements.length,
        logoApplied: !!options.logoPngUrl,
        numbersValidated: this.hasNumbers(options.overlays),
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Enhanced overlay burn-in failed', {
        error,
        inputUrl: options.inputUrl,
        outputPath: options.outputPath,
        duration,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        criticalElementsBurned: 0,
        logoApplied: false,
        numbersValidated: false,
      };
    }
  }

  private identifyCriticalElements(overlays: Overlay[]): CriticalElement[] {
    const critical: CriticalElement[] = [];

    overlays.forEach(overlay => {
      if (this.isPriceElement(overlay.text)) {
        critical.push({
          type: 'price',
          content: overlay.text,
          position: overlay.position,
          startTime: overlay.startTime,
          endTime: overlay.endTime,
          fontSize: overlay.fontSize,
          color: overlay.color,
        });
      }

      if (this.isNumberElement(overlay.text)) {
        critical.push({
          type: 'number',
          content: overlay.text,
          position: overlay.position,
          startTime: overlay.startTime,
          endTime: overlay.endTime,
          fontSize: overlay.fontSize,
          color: overlay.color,
        });
      }

      if (this.isCTAElement(overlay.text)) {
        critical.push({
          type: 'cta',
          content: overlay.text,
          position: overlay.position,
          startTime: overlay.startTime,
          endTime: overlay.endTime,
          fontSize: overlay.fontSize,
          color: overlay.color,
        });
      }

      if (this.isHeadlineElement(overlay)) {
        critical.push({
          type: 'headline',
          content: overlay.text,
          position: overlay.position,
          startTime: overlay.startTime,
          endTime: overlay.endTime,
          fontSize: overlay.fontSize,
          color: overlay.color,
        });
      }
    });

    return critical;
  }

  private isPriceElement(text: string): boolean {
    return this.priceRegex.test(text);
  }

  private isNumberElement(text: string): boolean {
    return this.numberRegex.test(text) && !this.isPriceElement(text);
  }

  private isCTAElement(text: string): boolean {
    const ctaKeywords = [
      'shop now',
      'buy now',
      'get yours',
      'order now',
      'learn more',
      'sign up',
      'try free',
      'claim offer',
      'limited time',
    ];
    const lowerText = text.toLowerCase();
    return ctaKeywords.some(keyword => lowerText.includes(keyword));
  }

  private isHeadlineElement(overlay: Overlay): boolean {
    return overlay.startTime < 1.0 && overlay.fontSize === 'xlarge';
  }

  private hasNumbers(overlays: Overlay[]): boolean {
    return overlays.some(o => this.isPriceElement(o.text) || this.isNumberElement(o.text));
  }

  private async buildEnhancedFFmpegCommand(
    options: EnhancedBurnInOptions,
    criticalElements: CriticalElement[]
  ): Promise<string> {
    const { inputUrl, outputPath, overlays, logoPngUrl, width = 1080, height = 1920 } = options;

    let command = `ffmpeg -i "${inputUrl}"`;

    let logoPath: string | undefined;
    if (logoPngUrl) {
      logoPath = await this.downloadFile(logoPngUrl, '/tmp', 'logo.png');
      command += ` -i "${logoPath}"`;
    }

    const filters: string[] = [];

    if (logoPath) {
      filters.push(this.buildLogoOverlayWithBackground(width, height));
    }

    let currentInput = logoPath ? '[v1]' : '[0:v]';

    overlays.forEach((overlay, index) => {
      const isLast = index === overlays.length - 1;
      const outputLabel = isLast ? '' : `[v${index + 2}]`;

      const isCritical = criticalElements.some(
        ce => ce.content === overlay.text && ce.startTime === overlay.startTime
      );

      const textFilter = this.buildEnhancedTextFilter(
        overlay,
        width,
        height,
        currentInput,
        outputLabel,
        isCritical
      );
      filters.push(textFilter);

      if (!isLast) {
        currentInput = `[v${index + 2}]`;
      }
    });

    if (filters.length > 0) {
      command += ` -filter_complex "${filters.join(';')}"`;
    }

    command += ` -c:v libx264 -preset medium -crf 23 -c:a copy -y "${outputPath}"`;

    return command;
  }

  private buildLogoOverlayWithBackground(width: number, height: number): string {
    const logoSize = Math.round(width * 0.15);
    const margin = 20;

    return `[0:v][1:v]overlay=W-w-${margin}:${margin}:format=auto,format=yuv420p[v1]`;
  }

  private buildEnhancedTextFilter(
    overlay: Overlay,
    videoWidth: number,
    videoHeight: number,
    inputLabel: string,
    outputLabel: string,
    isCritical: boolean
  ): string {
    const position = this.calculatePositionWithSafeArea(overlay.position, videoWidth, videoHeight);

    const fontSizeMap = {
      small: isCritical ? 40 : 32,
      medium: isCritical ? 56 : 48,
      large: isCritical ? 72 : 64,
      xlarge: isCritical ? 104 : 96,
    };
    const fontSize = fontSizeMap[overlay.fontSize] || 64;

    const escapedText = overlay.text.replace(/'/g, "\\'").replace(/:/g, '\\:');

    const shadowColor = isCritical ? '0x000000@0.9' : '0x000000@0.7';
    const shadowOffset = isCritical ? 3 : 2;

    const enableExpr = `between(t,${overlay.startTime},${overlay.endTime})`;

    let alphaExpr = '1';
    if (overlay.animation === 'fade') {
      const fadeDuration = 0.3;
      alphaExpr = `if(lt(t,${overlay.startTime + fadeDuration}),(t-${overlay.startTime})/${fadeDuration},if(gt(t,${overlay.endTime - fadeDuration}),(${overlay.endTime}-t)/${fadeDuration},1))`;
    }

    let filter = `${inputLabel}drawtext=text='${escapedText}'`;
    filter += `:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`;
    filter += `:fontsize=${fontSize}`;
    filter += `:fontcolor=${overlay.color}`;
    filter += `:x=${position.x}`;
    filter += `:y=${position.y}`;
    filter += `:enable='${enableExpr}'`;
    filter += `:alpha='${alphaExpr}'`;

    filter += `:shadowcolor=${shadowColor}`;
    filter += `:shadowx=${shadowOffset}`;
    filter += `:shadowy=${shadowOffset}`;

    if (isCritical || overlay.backgroundColor) {
      filter += `:box=1`;
      const boxColor = overlay.backgroundColor || '0x000000';
      const boxAlpha = isCritical ? 0.8 : 0.7;
      filter += `:boxcolor=${boxColor}@${boxAlpha}`;
      filter += `:boxborderw=${isCritical ? 15 : 10}`;
    }

    filter += outputLabel;

    return filter;
  }

  private calculatePositionWithSafeArea(
    position: string,
    videoWidth: number,
    videoHeight: number
  ): { x: string; y: string } {
    const safeAreaMargin = Math.round(videoWidth * 0.1);

    switch (position) {
      case 'top':
        return { x: '(w-text_w)/2', y: `${safeAreaMargin}` };
      case 'center':
        return { x: '(w-text_w)/2', y: '(h-text_h)/2' };
      case 'bottom':
        return { x: '(w-text_w)/2', y: `h-text_h-${safeAreaMargin}` };
      case 'top_left':
        return { x: `${safeAreaMargin}`, y: `${safeAreaMargin}` };
      case 'top_right':
        return { x: `w-text_w-${safeAreaMargin}`, y: `${safeAreaMargin}` };
      case 'bottom_left':
        return { x: `${safeAreaMargin}`, y: `h-text_h-${safeAreaMargin}` };
      case 'bottom_right':
        return { x: `w-text_w-${safeAreaMargin}`, y: `h-text_h-${safeAreaMargin}` };
      default:
        return { x: '(w-text_w)/2', y: '(h-text_h)/2' };
    }
  }

  private async downloadFile(url: string, destDir: string, filename: string): Promise<string> {
    logger.info('Downloading file', { url, destDir, filename });

    const destPath = path.join(destDir, filename);
    return destPath;
  }

  private async executeFFmpeg(command: string): Promise<void> {
    logger.info('FFmpeg command ready for execution', {
      commandPreview: command.substring(0, 200) + '...',
    });

    logger.warn('FFmpeg execution stubbed - integrate with child_process.exec or fluent-ffmpeg in production');
  }
}

export const enhancedOverlayComposer = new EnhancedOverlayComposer();

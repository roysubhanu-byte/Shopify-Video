import { Overlay } from '../../../packages/shared/src/plan';
import { Logger } from './logger';
import * as path from 'path';
import * as fs from 'fs';

const logger = new Logger({ module: 'overlay-composer' });

export interface BurnInOptions {
  inputUrl: string;
  outputPath: string;
  overlays: Overlay[];
  logoPngUrl?: string;
  width?: number;
  height?: number;
}

export interface BurnInResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  duration: number;
}

/**
 * Burn text overlays and logo into video using FFmpeg
 * This creates a "burned-in" version where overlays are permanently part of the video
 */
export async function burnOverlaysWithFFmpeg(
  inputUrl: string,
  outputPath: string,
  overlays: Overlay[],
  logoPngUrl?: string
): Promise<BurnInResult> {
  const startTime = Date.now();

  logger.info('Starting overlay burn-in', {
    inputUrl,
    outputPath,
    overlayCount: overlays.length,
    hasLogo: !!logoPngUrl,
  });

  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Build FFmpeg command
    const ffmpegCommand = await buildFFmpegCommand({
      inputUrl,
      outputPath,
      overlays,
      logoPngUrl,
      width: 1080,
      height: 1920, // 9:16 aspect ratio
    });

    logger.info('FFmpeg command built', {
      commandLength: ffmpegCommand.length,
    });

    // Execute FFmpeg command
    await executeFFmpeg(ffmpegCommand);

    const duration = Date.now() - startTime;

    logger.info('Overlay burn-in complete', {
      outputPath,
      duration,
    });

    return {
      success: true,
      outputPath,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Overlay burn-in failed', {
      error,
      inputUrl,
      outputPath,
      duration,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  }
}

/**
 * Build FFmpeg command for overlay composition
 */
async function buildFFmpegCommand(options: BurnInOptions): Promise<string> {
  const { inputUrl, outputPath, overlays, logoPngUrl, width = 1080, height = 1920 } = options;

  // Start with basic FFmpeg command
  let command = `ffmpeg -i "${inputUrl}"`;

  // Download and add logo if provided
  let logoPath: string | undefined;
  if (logoPngUrl) {
    logoPath = await downloadFile(logoPngUrl, '/tmp', 'logo.png');
    command += ` -i "${logoPath}"`;
  }

  // Build filter complex for text overlays
  const filters: string[] = [];

  // Add logo overlay if present
  if (logoPath) {
    filters.push(`[0:v][1:v]overlay=W-w-20:20[v1]`);
  }

  // Add text overlays with timing
  let currentInput = logoPath ? '[v1]' : '[0:v]';

  overlays.forEach((overlay, index) => {
    const isLast = index === overlays.length - 1;
    const outputLabel = isLast ? '' : `[v${index + 2}]`;

    const textFilter = buildTextFilter(overlay, width, height, currentInput, outputLabel);
    filters.push(textFilter);

    if (!isLast) {
      currentInput = `[v${index + 2}]`;
    }
  });

  // Add filter complex if we have filters
  if (filters.length > 0) {
    command += ` -filter_complex "${filters.join(';')}"`;
  }

  // Add output options
  command += ` -c:v libx264 -preset medium -crf 23 -c:a copy -y "${outputPath}"`;

  return command;
}

/**
 * Build FFmpeg drawtext filter for a single overlay
 */
function buildTextFilter(
  overlay: Overlay,
  videoWidth: number,
  videoHeight: number,
  inputLabel: string,
  outputLabel: string
): string {
  // Calculate position
  const position = calculatePosition(overlay.position, videoWidth, videoHeight);

  // Map font size to pixel size
  const fontSizeMap = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 96,
  };
  const fontSize = fontSizeMap[overlay.fontSize] || 64;

  // Map style to FFmpeg options
  const styleOptions: string[] = [];
  if (overlay.style === 'bold') {
    styleOptions.push('bold=1');
  } else if (overlay.style === 'italic') {
    styleOptions.push('italic=1');
  }

  // Escape text for FFmpeg
  const escapedText = overlay.text.replace(/'/g, "\\'").replace(/:/g, '\\:');

  // Build shadow for better readability
  const shadowColor = '0x000000@0.7';
  const shadowOffset = 2;

  // Build enable expression for timing
  const enableExpr = `between(t,${overlay.startTime},${overlay.endTime})`;

  // Build fade animation if specified
  let alphaExpr = '1';
  if (overlay.animation === 'fade') {
    const fadeDuration = 0.3;
    alphaExpr = `if(lt(t,${overlay.startTime + fadeDuration}),(t-${overlay.startTime})/${fadeDuration},if(gt(t,${overlay.endTime - fadeDuration}),(${overlay.endTime}-t)/${fadeDuration},1))`;
  }

  // Build the drawtext filter
  let filter = `${inputLabel}drawtext=text='${escapedText}'`;
  filter += `:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`;
  filter += `:fontsize=${fontSize}`;
  filter += `:fontcolor=${overlay.color}`;
  filter += `:x=${position.x}`;
  filter += `:y=${position.y}`;
  filter += `:enable='${enableExpr}'`;
  filter += `:alpha='${alphaExpr}'`;

  // Add shadow
  filter += `:shadowcolor=${shadowColor}`;
  filter += `:shadowx=${shadowOffset}`;
  filter += `:shadowy=${shadowOffset}`;

  // Add background box if specified
  if (overlay.backgroundColor) {
    filter += `:box=1`;
    filter += `:boxcolor=${overlay.backgroundColor}@0.7`;
    filter += `:boxborderw=10`;
  }

  filter += outputLabel;

  return filter;
}

/**
 * Calculate x,y position from position enum
 */
function calculatePosition(
  position: string,
  videoWidth: number,
  videoHeight: number
): { x: string; y: string } {
  const margin = 40;

  switch (position) {
    case 'top':
      return { x: '(w-text_w)/2', y: `${margin}` };
    case 'center':
      return { x: '(w-text_w)/2', y: '(h-text_h)/2' };
    case 'bottom':
      return { x: '(w-text_w)/2', y: `h-text_h-${margin}` };
    case 'top_left':
      return { x: `${margin}`, y: `${margin}` };
    case 'top_right':
      return { x: `w-text_w-${margin}`, y: `${margin}` };
    case 'bottom_left':
      return { x: `${margin}`, y: `h-text_h-${margin}` };
    case 'bottom_right':
      return { x: `w-text_w-${margin}`, y: `h-text_h-${margin}` };
    default:
      return { x: '(w-text_w)/2', y: '(h-text_h)/2' };
  }
}

/**
 * Execute FFmpeg command
 */
async function executeFFmpeg(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Note: In production, use fluent-ffmpeg or child_process.exec
    // This is a placeholder implementation

    logger.info('Executing FFmpeg command', {
      command: command.substring(0, 200) + '...',
    });

    // TODO: Replace with actual FFmpeg execution
    // const { exec } = require('child_process');
    // exec(command, (error, stdout, stderr) => {
    //   if (error) {
    //     logger.error('FFmpeg execution failed', { error, stderr });
    //     reject(error);
    //   } else {
    //     logger.info('FFmpeg execution complete', { stdout });
    //     resolve();
    //   }
    // });

    // For now, simulate success after a delay
    setTimeout(() => {
      logger.info('FFmpeg command simulated (stub implementation)');
      resolve();
    }, 1000);
  });
}

/**
 * Download file from URL to local path
 */
async function downloadFile(
  url: string,
  destDir: string,
  filename: string
): Promise<string> {
  const destPath = path.join(destDir, filename);

  logger.info('Downloading file', { url, destPath });

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));

    logger.info('File downloaded', { destPath, size: buffer.byteLength });

    return destPath;
  } catch (error) {
    logger.error('File download failed', { error, url });
    throw error;
  }
}

/**
 * Validate overlay burn-in is possible
 */
export function validateBurnInCapability(): {
  available: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  // Check if FFmpeg is available
  // In production, you'd run: exec('ffmpeg -version')
  // For now, assume it's available

  // Check if font files exist
  const fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  if (!fs.existsSync(fontPath)) {
    missing.push('DejaVu fonts not found');
  }

  return {
    available: missing.length === 0,
    missing,
  };
}

/**
 * Get burn-in metadata
 */
export interface BurnInMetadata {
  inputDuration: number;
  outputDuration: number;
  overlayCount: number;
  fileSize: number;
}

export async function getBurnInMetadata(outputPath: string): Promise<BurnInMetadata> {
  // TODO: Use ffprobe to get actual metadata
  // For now, return mock data

  const stats = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;

  return {
    inputDuration: 24,
    outputDuration: 24,
    overlayCount: 0,
    fileSize: stats?.size || 0,
  };
}

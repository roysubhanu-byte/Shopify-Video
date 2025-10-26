import { Logger } from './logger';
import { WordTimestamp } from './tts-service';

const logger = new Logger({ module: 'srt-generator' });

export interface SRTCue {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Generate SRT subtitle file from TTS word timestamps
 *
 * Groups words into readable subtitle chunks (max 6 words per line)
 * Formats timing in SRT format: HH:MM:SS,mmm
 */
export function generateSRT(wordTimestamps: WordTimestamp[]): string {
  logger.info('Generating SRT subtitles', {
    wordCount: wordTimestamps.length,
  });

  if (wordTimestamps.length === 0) {
    logger.warn('No word timestamps provided, generating empty SRT');
    return '';
  }

  // Group words into subtitle cues (max 6 words per cue)
  const maxWordsPerCue = 6;
  const cues: SRTCue[] = [];

  for (let i = 0; i < wordTimestamps.length; i += maxWordsPerCue) {
    const chunk = wordTimestamps.slice(i, i + maxWordsPerCue);

    const cue: SRTCue = {
      index: cues.length + 1,
      startTime: formatSRTTime(chunk[0].startTime),
      endTime: formatSRTTime(chunk[chunk.length - 1].endTime),
      text: chunk.map((w) => w.word).join(' '),
    };

    cues.push(cue);
  }

  // Convert to SRT format
  const srtContent = cues
    .map(
      (cue) =>
        `${cue.index}\n${cue.startTime} --> ${cue.endTime}\n${cue.text}\n`
    )
    .join('\n');

  logger.info('SRT generation complete', {
    cueCount: cues.length,
    totalWords: wordTimestamps.length,
    duration: formatSRTTime(wordTimestamps[wordTimestamps.length - 1].endTime),
  });

  return srtContent;
}

/**
 * Format seconds to SRT time format: HH:MM:SS,mmm
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(millis, 3)}`;
}

/**
 * Pad number with leading zeros
 */
function pad(num: number, length: number): string {
  return num.toString().padStart(length, '0');
}

/**
 * Save SRT content to file
 */
export async function saveSRTToFile(
  srtContent: string,
  runId: string
): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');

  const filename = `${runId}_subtitles.srt`;
  const filepath = path.join('/tmp', filename);

  fs.writeFileSync(filepath, srtContent, 'utf-8');

  logger.info('SRT saved to file', {
    filepath,
    size: srtContent.length,
  });

  return filepath;
}

/**
 * Upload SRT to storage and return public URL
 */
export async function uploadSRTToStorage(
  srtContent: string,
  runId: string
): Promise<string> {
  logger.info('Uploading SRT to storage', {
    runId,
    size: srtContent.length,
  });

  // TODO: Upload to Supabase Storage or S3
  // For now, return mock URL

  const mockUrl = `https://storage.example.com/srt/${runId}_subtitles.srt`;

  logger.info('SRT uploaded (mock)', {
    url: mockUrl,
  });

  return mockUrl;
}

/**
 * Generate VTT (WebVTT) format instead of SRT
 * WebVTT is more modern and better for web players
 */
export function generateVTT(wordTimestamps: WordTimestamp[]): string {
  logger.info('Generating VTT subtitles', {
    wordCount: wordTimestamps.length,
  });

  if (wordTimestamps.length === 0) {
    return 'WEBVTT\n\n';
  }

  // Group words into subtitle cues
  const maxWordsPerCue = 6;
  const cues: SRTCue[] = [];

  for (let i = 0; i < wordTimestamps.length; i += maxWordsPerCue) {
    const chunk = wordTimestamps.slice(i, i + maxWordsPerCue);

    const cue: SRTCue = {
      index: cues.length + 1,
      startTime: formatVTTTime(chunk[0].startTime),
      endTime: formatVTTTime(chunk[chunk.length - 1].endTime),
      text: chunk.map((w) => w.word).join(' '),
    };

    cues.push(cue);
  }

  // Convert to VTT format
  const vttContent =
    'WEBVTT\n\n' +
    cues
      .map(
        (cue) =>
          `${cue.startTime} --> ${cue.endTime}\n${cue.text}\n`
      )
      .join('\n');

  logger.info('VTT generation complete', {
    cueCount: cues.length,
  });

  return vttContent;
}

/**
 * Format seconds to VTT time format: HH:MM:SS.mmm
 */
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(millis, 3)}`;
}

/**
 * Validate SRT content
 */
export function validateSRT(srtContent: string): {
  valid: boolean;
  errors: string[];
  cueCount: number;
} {
  const errors: string[] = [];

  if (!srtContent || srtContent.trim().length === 0) {
    errors.push('SRT content is empty');
    return { valid: false, errors, cueCount: 0 };
  }

  // Count cues (lines that contain only numbers)
  const lines = srtContent.split('\n');
  const cueCount = lines.filter((line) => /^\d+$/.test(line.trim())).length;

  if (cueCount === 0) {
    errors.push('No subtitle cues found');
  }

  // Check for timing lines
  const timingLines = lines.filter((line) => line.includes('-->'));
  if (timingLines.length !== cueCount) {
    errors.push(`Timing line count (${timingLines.length}) does not match cue count (${cueCount})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    cueCount,
  };
}

/**
 * Parse SRT content back into cues
 */
export function parseSRT(srtContent: string): SRTCue[] {
  const cues: SRTCue[] = [];
  const blocks = srtContent.trim().split('\n\n');

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;

    const index = parseInt(lines[0]);
    const timingMatch = lines[1].match(/(\S+)\s+-->\s+(\S+)/);

    if (!timingMatch) continue;

    const cue: SRTCue = {
      index,
      startTime: timingMatch[1],
      endTime: timingMatch[2],
      text: lines.slice(2).join('\n'),
    };

    cues.push(cue);
  }

  return cues;
}

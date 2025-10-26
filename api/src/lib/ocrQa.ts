import { Overlay } from '../types/plan';
import { Logger } from './logger';

const logger = new Logger({ module: 'ocr-qa' });

export interface OcrQaResult {
  ok: boolean;
  foundOverlays: string[];
  missingOverlays: string[];
  confidence: number;
  needsBurnIn: boolean;
  details: string[];
}

export interface ExpectedOverlay {
  text: string;
  startTime: number;
  endTime: number;
  position: string;
}

/**
 * Run OCR Quality Assurance on generated video
 * Checks if expected text overlays are present in the video
 *
 * NOTE: This is a stub implementation for now
 * TODO: Integrate with actual OCR service (Google Vision API, AWS Rekognition, or Tesseract)
 */
export async function runOcrQa(
  videoUrl: string,
  expectedOverlays: ExpectedOverlay[]
): Promise<OcrQaResult> {
  logger.info('Running OCR QA', {
    videoUrl,
    expectedOverlayCount: expectedOverlays.length,
  });

  try {
    // STUB: For now, return a mock result
    // In production, this would:
    // 1. Download video or stream frames
    // 2. Extract frames at overlay timestamps
    // 3. Run OCR on each frame
    // 4. Match detected text against expected overlays
    // 5. Calculate confidence scores

    const mockResult = await mockOcrAnalysis(videoUrl, expectedOverlays);

    logger.info('OCR QA complete', {
      ok: mockResult.ok,
      foundCount: mockResult.foundOverlays.length,
      missingCount: mockResult.missingOverlays.length,
      confidence: mockResult.confidence,
    });

    return mockResult;
  } catch (error) {
    logger.error('OCR QA failed', { error, videoUrl });

    return {
      ok: false,
      foundOverlays: [],
      missingOverlays: expectedOverlays.map((o) => o.text),
      confidence: 0,
      needsBurnIn: true,
      details: ['OCR QA failed due to error', String(error)],
    };
  }
}

/**
 * Mock OCR analysis for development
 * Replace with actual OCR implementation
 */
async function mockOcrAnalysis(
  videoUrl: string,
  expectedOverlays: ExpectedOverlay[]
): Promise<OcrQaResult> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // For now, assume 80% success rate randomly
  const successRate = 0.8;
  const foundOverlays: string[] = [];
  const missingOverlays: string[] = [];

  expectedOverlays.forEach((overlay) => {
    if (Math.random() < successRate) {
      foundOverlays.push(overlay.text);
    } else {
      missingOverlays.push(overlay.text);
    }
  });

  const confidence = foundOverlays.length / expectedOverlays.length;
  const ok = confidence >= 0.9; // 90% threshold

  return {
    ok,
    foundOverlays,
    missingOverlays,
    confidence,
    needsBurnIn: !ok,
    details: [
      `Found ${foundOverlays.length}/${expectedOverlays.length} overlays`,
      `Confidence: ${(confidence * 100).toFixed(1)}%`,
      ok ? 'QA passed' : 'QA failed - burn-in required',
    ],
  };
}

/**
 * Convert Plan overlays to expected overlay format
 */
export function extractExpectedOverlays(overlays: Overlay[]): ExpectedOverlay[] {
  return overlays.map((overlay) => ({
    text: overlay.text,
    startTime: overlay.startTime,
    endTime: overlay.endTime,
    position: overlay.position,
  }));
}

/**
 * Real OCR implementation using Google Cloud Vision API
 * Uncomment and configure when ready to use
 */
/*
import vision from '@google-cloud/vision';

async function runGoogleVisionOcr(
  videoUrl: string,
  expectedOverlays: ExpectedOverlay[]
): Promise<OcrQaResult> {
  const client = new vision.ImageAnnotatorClient();

  // Download video and extract frames at overlay timestamps
  const frames = await extractFrames(videoUrl, expectedOverlays);

  const foundOverlays: string[] = [];
  const missingOverlays: string[] = [];

  for (const expected of expectedOverlays) {
    const frame = frames.find(
      (f) => f.timestamp >= expected.startTime && f.timestamp <= expected.endTime
    );

    if (!frame) {
      missingOverlays.push(expected.text);
      continue;
    }

    const [result] = await client.textDetection(frame.imageBuffer);
    const detections = result.textAnnotations || [];
    const detectedText = detections.map((t) => t.description).join(' ');

    // Check if expected text is in detected text (fuzzy match)
    const similarity = calculateSimilarity(expected.text, detectedText);

    if (similarity > 0.8) {
      foundOverlays.push(expected.text);
    } else {
      missingOverlays.push(expected.text);
    }
  }

  const confidence = foundOverlays.length / expectedOverlays.length;

  return {
    ok: confidence >= 0.9,
    foundOverlays,
    missingOverlays,
    confidence,
    needsBurnIn: confidence < 0.9,
    details: [`OCR analysis complete`, `Confidence: ${confidence}`],
  };
}
*/

/**
 * Real OCR implementation using Tesseract.js
 * Uncomment and configure when ready to use
 */
/*
import Tesseract from 'tesseract.js';
import ffmpeg from 'fluent-ffmpeg';

async function runTesseractOcr(
  videoUrl: string,
  expectedOverlays: ExpectedOverlay[]
): Promise<OcrQaResult> {
  const foundOverlays: string[] = [];
  const missingOverlays: string[] = [];

  for (const expected of expectedOverlays) {
    const timestamp = (expected.startTime + expected.endTime) / 2;

    // Extract frame at timestamp
    const framePath = await extractSingleFrame(videoUrl, timestamp);

    // Run OCR
    const { data: { text } } = await Tesseract.recognize(framePath, 'eng');

    // Check if expected text is present
    const normalizedExpected = expected.text.toLowerCase().trim();
    const normalizedDetected = text.toLowerCase().trim();

    if (normalizedDetected.includes(normalizedExpected)) {
      foundOverlays.push(expected.text);
    } else {
      missingOverlays.push(expected.text);
    }
  }

  const confidence = foundOverlays.length / expectedOverlays.length;

  return {
    ok: confidence >= 0.9,
    foundOverlays,
    missingOverlays,
    confidence,
    needsBurnIn: confidence < 0.9,
    details: [`Tesseract OCR complete`, `Confidence: ${confidence}`],
  };
}

async function extractSingleFrame(
  videoUrl: string,
  timestamp: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = `/tmp/frame_${Date.now()}_${timestamp}.jpg`;

    ffmpeg(videoUrl)
      .seekInput(timestamp)
      .frames(1)
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}
*/

/**
 * Calculate text similarity (Levenshtein distance)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const norm1 = text1.toLowerCase().trim();
  const norm2 = text2.toLowerCase().trim();

  if (norm1 === norm2) return 1.0;
  if (norm2.includes(norm1)) return 0.9;

  // Simple word overlap for now
  const words1 = new Set(norm1.split(/\s+/));
  const words2 = new Set(norm2.split(/\s+/));

  const intersection = [...words1].filter((w) => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;

  return intersection / union;
}

/**
 * Get QA threshold configuration
 */
export function getQaThresholds() {
  return {
    minConfidence: 0.9, // 90% of overlays must be detected
    minSimilarity: 0.8, // 80% text similarity for fuzzy match
    maxRetries: 2,
  };
}

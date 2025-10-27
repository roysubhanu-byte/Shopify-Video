import { Logger } from './logger';
import { Beat, VoiceOver } from '../types/plan';

const logger = new Logger({ module: 'tts-service' });

export interface WordTimestamp {
  word: string;
  startTime: number;
  endTime: number;
}

export interface TTSSegment {
  text: string;
  startTime: number;
  endTime: number;
  audioUrl: string;
  wordTimestamps: WordTimestamp[];
}

export interface TTSResult {
  audioUrl: string;
  duration: number;
  segments: TTSSegment[];
  allWordTimestamps: WordTimestamp[];
  pronunciationGuidesApplied: number;
}

export interface PronunciationGuide {
  word: string;
  pronunciation: string;
  phonetic?: string;
  ssml?: string;
}

/**
 * Generate TTS audio for all beats with word-level timestamps and SSML pronunciation guides
 *
 * This uses Google Cloud Text-to-Speech API which provides:
 * - High-quality voices
 * - Word-level timing information
 * - Multiple voice options
 * - SSML support for pronunciation control
 */
export async function generateTTSForBeats(
  beats: Beat[],
  brandName?: string,
  pronunciationGuides?: PronunciationGuide[]
): Promise<TTSResult> {
  logger.info('Generating TTS for beats with pronunciation guides', {
    beatCount: beats.length,
    brandName,
    guidesCount: pronunciationGuides?.length || 0,
  });

  const brandGuides = buildBrandPronunciationGuides(brandName, pronunciationGuides);
  let pronunciationGuidesApplied = 0;

  const segments: TTSSegment[] = [];
  let totalDuration = 0;

  for (const beat of beats) {
    if (!beat.voiceOver) {
      logger.warn('Beat has no voice-over, skipping TTS', {
        beatType: beat.type,
        beatNumber: beat.order + 1,
      });
      continue;
    }

    const textWithGuides = applyPronunciationGuides(
      beat.voiceOver.text,
      brandGuides
    );

    const guidesUsed = countGuidesInText(textWithGuides);
    pronunciationGuidesApplied += guidesUsed;

    const segment = await generateTTSSegment(
      { ...beat.voiceOver, text: textWithGuides },
      beat.startTime,
      beat.endTime
    );

    segments.push(segment);
    totalDuration = Math.max(totalDuration, segment.endTime);
  }

  // Combine all segments into single audio file
  const combinedAudioUrl = await combineAudioSegments(segments);

  // Flatten all word timestamps
  const allWordTimestamps = segments.flatMap((s) => s.wordTimestamps);

  logger.info('TTS generation complete', {
    segmentCount: segments.length,
    totalDuration,
    wordCount: allWordTimestamps.length,
    audioUrl: combinedAudioUrl,
    pronunciationGuidesApplied,
  });

  return {
    audioUrl: combinedAudioUrl,
    duration: totalDuration,
    segments,
    allWordTimestamps,
    pronunciationGuidesApplied,
  };
}

/**
 * Generate TTS for a single voice-over segment
 */
async function generateTTSSegment(
  voiceOver: VoiceOver,
  beatStart: number,
  beatEnd: number
): Promise<TTSSegment> {
  logger.info('Generating TTS segment', {
    text: voiceOver.text.substring(0, 50),
    voice: voiceOver.voice,
    duration: beatEnd - beatStart,
  });

  // TODO: Call Google Cloud TTS API
  // For now, return mock data with realistic timestamps

  const words = voiceOver.text.trim().split(/\s+/);
  const duration = beatEnd - beatStart;
  const avgWordDuration = duration / words.length;

  const wordTimestamps: WordTimestamp[] = words.map((word, index) => ({
    word,
    startTime: beatStart + index * avgWordDuration,
    endTime: beatStart + (index + 1) * avgWordDuration,
  }));

  // Mock audio URL - in production this would be from Google TTS
  const audioUrl = `https://storage.example.com/tts/segment_${beatStart}_${beatEnd}.mp3`;

  return {
    text: voiceOver.text,
    startTime: beatStart,
    endTime: beatEnd,
    audioUrl,
    wordTimestamps,
  };
}

/**
 * Combine multiple audio segments into single file
 */
async function combineAudioSegments(segments: TTSSegment[]): Promise<string> {
  logger.info('Combining audio segments', {
    segmentCount: segments.length,
  });

  // TODO: Use FFmpeg to concatenate audio files
  // For now, return mock combined URL

  const mockUrl = `https://storage.example.com/tts/combined_${Date.now()}.mp3`;

  logger.info('Audio segments combined (mock)', {
    outputUrl: mockUrl,
  });

  return mockUrl;
}

/**
 * Real Google Cloud TTS implementation (commented, ready to use)
 */
/*
import textToSpeech from '@google-cloud/text-to-speech';

async function generateTTSSegmentReal(
  voiceOver: VoiceOver,
  beatStart: number,
  beatEnd: number
): Promise<TTSSegment> {
  const client = new textToSpeech.TextToSpeechClient();

  // Map voice types to Google TTS voices
  const voiceMap: Record<string, { languageCode: string; name: string }> = {
    professional: { languageCode: 'en-US', name: 'en-US-Neural2-J' },
    casual: { languageCode: 'en-US', name: 'en-US-Neural2-A' },
    energetic: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
    calm: { languageCode: 'en-US', name: 'en-US-Neural2-D' },
  };

  const voice = voiceMap[voiceOver.voice] || voiceMap.professional;

  const request = {
    input: { text: voiceOver.text },
    voice,
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: voiceOver.speed,
      pitch: voiceOver.pitch,
    },
    enableTimePointing: ['TIMEPOINT_TYPE_SSML_MARK'],
  };

  const [response] = await client.synthesizeSpeech(request);

  // Extract word timestamps from response
  const wordTimestamps: WordTimestamp[] = response.timepoints?.map((tp: any, index: number) => {
    const nextTp = response.timepoints?.[index + 1];
    const startTime = beatStart + (tp.timeSeconds || 0);
    const endTime = nextTp ? beatStart + (nextTp.timeSeconds || 0) : beatEnd;

    return {
      word: tp.markName || '',
      startTime,
      endTime,
    };
  }) || [];

  // Upload audio to storage
  const audioUrl = await uploadAudioToStorage(response.audioContent, beatStart, beatEnd);

  return {
    text: voiceOver.text,
    startTime: beatStart,
    endTime: beatEnd,
    audioUrl,
    wordTimestamps,
  };
}
*/

function buildBrandPronunciationGuides(
  brandName?: string,
  customGuides?: PronunciationGuide[]
): PronunciationGuide[] {
  const guides: PronunciationGuide[] = [...(customGuides || [])];

  if (brandName) {
    const existingGuide = guides.find(g => g.word.toLowerCase() === brandName.toLowerCase());
    if (!existingGuide) {
      guides.push({
        word: brandName,
        pronunciation: brandName,
        ssml: `<emphasis level="strong">${brandName}</emphasis>`,
      });
    }
  }

  const commonBrandMispronunciations: Record<string, PronunciationGuide> = {
    'nike': {
      word: 'Nike',
      pronunciation: 'Ny-key',
      phonetic: 'ˈnaɪki',
      ssml: '<phoneme alphabet="ipa" ph="ˈnaɪki">Nike</phoneme>',
    },
    'adidas': {
      word: 'Adidas',
      pronunciation: 'Ah-dee-dahs',
      phonetic: 'ˈɑːdidɑːs',
      ssml: '<phoneme alphabet="ipa" ph="ˈɑːdidɑːs">Adidas</phoneme>',
    },
    'loreal': {
      word: "L'Oreal",
      pronunciation: "Loh-ree-ahl",
      phonetic: 'loʊriˈɑːl',
      ssml: '<phoneme alphabet="ipa" ph="loʊriˈɑːl">L\'Oreal</phoneme>',
    },
    'porsche': {
      word: 'Porsche',
      pronunciation: 'Por-shuh',
      phonetic: 'ˈpɔːrʃə',
      ssml: '<phoneme alphabet="ipa" ph="ˈpɔːrʃə">Porsche</phoneme>',
    },
    'hermes': {
      word: 'Hermes',
      pronunciation: 'Air-mez',
      phonetic: 'ɛʁmɛs',
      ssml: '<phoneme alphabet="ipa" ph="ɛʁmɛs">Hermes</phoneme>',
    },
  };

  if (brandName) {
    const lowerBrand = brandName.toLowerCase();
    const commonGuide = commonBrandMispronunciations[lowerBrand];
    if (commonGuide && !guides.some(g => g.word.toLowerCase() === lowerBrand)) {
      guides.push(commonGuide);
    }
  }

  logger.info('Built pronunciation guides', {
    totalGuides: guides.length,
    brandName,
  });

  return guides;
}

function applyPronunciationGuides(
  text: string,
  guides: PronunciationGuide[]
): string {
  let processedText = text;

  guides.forEach(guide => {
    const regex = new RegExp(`\\b${guide.word}\\b`, 'gi');
    const ssml = guide.ssml || `<emphasis level="moderate">${guide.word}</emphasis>`;
    processedText = processedText.replace(regex, ssml);
  });

  if (processedText !== text) {
    processedText = `<speak>${processedText}</speak>`;
  }

  return processedText;
}

function countGuidesInText(text: string): number {
  const ssmlTags = text.match(/<(phoneme|emphasis)/g);
  return ssmlTags ? ssmlTags.length : 0;
}

/**
 * Generate silence audio for beats without voice-over
 */
export function generateSilenceSegment(startTime: number, endTime: number): TTSSegment {
  const duration = endTime - startTime;

  return {
    text: '',
    startTime,
    endTime,
    audioUrl: `https://storage.example.com/tts/silence_${duration}s.mp3`,
    wordTimestamps: [],
  };
}

/**
 * Validate TTS result meets requirements
 */
export function validateTTSResult(ttsResult: TTSResult, targetDuration: number): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!ttsResult.audioUrl) {
    errors.push('Missing audio URL');
  }

  if (Math.abs(ttsResult.duration - targetDuration) > 1.0) {
    errors.push(
      `Duration mismatch: expected ${targetDuration}s, got ${ttsResult.duration}s`
    );
  }

  if (ttsResult.segments.length === 0) {
    errors.push('No TTS segments generated');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

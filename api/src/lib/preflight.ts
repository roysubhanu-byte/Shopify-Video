import {
  Plan,
  PlanSchema,
  Beat,
  Overlay,
  VoiceOver,
  countWords,
  calculateWPS,
  containsForbiddenClaims,
  validateBeatOrder,
  validateOverlayWordCount,
  validateVoiceOverWPS,
} from '../../../packages/shared/src/plan';
import { Logger } from './logger';

const logger = new Logger({ module: 'preflight' });

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized: Plan | null;
}

/**
 * Validate and normalize a Plan
 * - Enforces ≤6 words per overlay
 * - Enforces ≤2.5 words per second in voice-overs
 * - Softens forbidden claims
 * - Ensures beat order is HOOK → DEMO → PROOF → CTA
 * - Validates timings and durations
 */
export async function validateAndNormalizePlan(rawPlan: unknown): Promise<ValidationResult> {
  logger.info('Starting plan validation', { hasData: !!rawPlan });

  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Validate against Zod schema
  const parseResult = PlanSchema.safeParse(rawPlan);

  if (!parseResult.success) {
    const zodErrors = parseResult.error.issues.map(
      (err: any) => `${err.path.join('.')}: ${err.message}`
    );
    logger.error('Plan schema validation failed', { errors: zodErrors });
    return {
      valid: false,
      errors: ['Schema validation failed', ...zodErrors],
      warnings: [],
      normalized: null,
    };
  }

  let plan = parseResult.data;

  // Ensure constraints are set
  if (!plan.constraints) {
    plan.constraints = {
      maxOverlayWords: 6,
      maxVoiceOverWPS: 2.5,
      forbiddenClaims: [
        'cure', 'treat', 'diagnose', 'prevent', 'guarantee',
        'miracle', 'instant', 'overnight', 'revolutionary',
      ],
      requireBeatOrder: ['hook', 'demo', 'proof', 'cta'],
      minBeatDuration: 4,
      maxBeatDuration: 8,
      totalDuration: 24,
    };
  }

  // Step 2: Validate and enforce beat order
  const requiredOrder = plan.constraints.requireBeatOrder;
  if (!validateBeatOrder(plan.beats, requiredOrder)) {
    logger.warn('Beat order incorrect, reordering beats', {
      current: plan.beats.map((b) => b.type),
      required: requiredOrder,
    });

    plan.beats = reorderBeats(plan.beats, requiredOrder);
    warnings.push('Beats were reordered to match required sequence: HOOK → DEMO → PROOF → CTA');
  }

  // Step 3: Validate and fix overlay word counts
  for (const beat of plan.beats) {
    for (let i = 0; i < beat.overlays.length; i++) {
      const overlay = beat.overlays[i];

      if (!validateOverlayWordCount(overlay, plan.constraints.maxOverlayWords)) {
        const originalText = overlay.text;
        overlay.text = truncateToWordLimit(overlay.text, plan.constraints.maxOverlayWords);

        warnings.push(
          `Beat ${beat.type}: Overlay text truncated from "${originalText}" to "${overlay.text}"`
        );

        logger.warn('Overlay text truncated', {
          beat: beat.type,
          original: originalText,
          truncated: overlay.text,
        });
      }
    }
  }

  // Step 4: Validate and fix voice-over WPS
  for (const beat of plan.beats) {
    if (beat.voiceOver) {
      const vo = beat.voiceOver;

      if (!validateVoiceOverWPS(vo, plan.constraints.maxVoiceOverWPS)) {
        const originalText = vo.text;
        const duration = vo.endTime - vo.startTime;
        const maxWords = Math.floor(duration * plan.constraints.maxVoiceOverWPS);

        vo.text = truncateToWordLimit(vo.text, maxWords);

        warnings.push(
          `Beat ${beat.type}: Voice-over truncated to ${maxWords} words for ${duration}s duration (max ${plan.constraints.maxVoiceOverWPS} WPS)`
        );

        logger.warn('Voice-over truncated', {
          beat: beat.type,
          duration,
          maxWords,
          originalLength: countWords(originalText),
          newLength: countWords(vo.text),
        });
      }
    }
  }

  // Step 5: Soften forbidden claims
  const allText = [
    plan.hookText,
    ...plan.beats.flatMap((b) => [
      ...b.overlays.map((o) => o.text),
      b.voiceOver?.text || '',
    ]),
  ].join(' ');

  const foundClaims = containsForbiddenClaims(allText, plan.constraints.forbiddenClaims);

  if (foundClaims.length > 0) {
    logger.warn('Forbidden claims detected', { claims: foundClaims });

    // Soften hook text
    plan.hookText = softenClaims(plan.hookText, plan.constraints.forbiddenClaims);

    // Soften overlays and voice-overs
    for (const beat of plan.beats) {
      beat.overlays = beat.overlays.map((overlay) => ({
        ...overlay,
        text: softenClaims(overlay.text, plan.constraints.forbiddenClaims),
      }));

      if (beat.voiceOver) {
        beat.voiceOver.text = softenClaims(
          beat.voiceOver.text,
          plan.constraints.forbiddenClaims
        );
      }
    }

    warnings.push(
      `Softened forbidden claims: ${foundClaims.join(', ')}. Replaced with safer alternatives.`
    );
  }

  // Step 6: Validate beat timings
  const timingErrors = validateBeatTimings(plan.beats, plan.targetDuration);
  if (timingErrors.length > 0) {
    errors.push(...timingErrors);
  }

  // Step 7: Validate overlay timings within beats
  for (const beat of plan.beats) {
    for (const overlay of beat.overlays) {
      if (overlay.startTime < beat.startTime || overlay.endTime > beat.endTime) {
        errors.push(
          `Beat ${beat.type}: Overlay timing (${overlay.startTime}s-${overlay.endTime}s) outside beat bounds (${beat.startTime}s-${beat.endTime}s)`
        );
      }

      if (overlay.startTime >= overlay.endTime) {
        errors.push(
          `Beat ${beat.type}: Overlay start time (${overlay.startTime}s) must be before end time (${overlay.endTime}s)`
        );
      }
    }

    if (beat.voiceOver) {
      if (
        beat.voiceOver.startTime < beat.startTime ||
        beat.voiceOver.endTime > beat.endTime
      ) {
        errors.push(
          `Beat ${beat.type}: Voice-over timing outside beat bounds`
        );
      }
    }
  }

  // Step 8: Validate assets
  if (plan.selectedAssets.length < 3) {
    errors.push(`At least 3 assets required, got ${plan.selectedAssets.length}`);
  }

  // Mark as validated
  plan.isValidated = errors.length === 0;
  plan.validationErrors = errors;
  plan.updatedAt = new Date().toISOString();

  logger.info('Plan validation complete', {
    valid: plan.isValidated,
    errorCount: errors.length,
    warningCount: warnings.length,
  });

  return {
    valid: plan.isValidated,
    errors,
    warnings,
    normalized: plan,
  };
}

/**
 * Reorder beats to match required sequence
 */
function reorderBeats(beats: Beat[], requiredOrder: string[]): Beat[] {
  const beatMap = new Map<string, Beat>();
  beats.forEach((beat) => beatMap.set(beat.type, beat));

  const reordered: Beat[] = [];
  requiredOrder.forEach((type, index) => {
    const beat = beatMap.get(type);
    if (beat) {
      reordered.push({
        ...beat,
        order: index,
      });
    }
  });

  return reordered;
}

/**
 * Truncate text to maximum word count
 */
function truncateToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);

  if (words.length <= maxWords) {
    return text;
  }

  return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Soften forbidden claims in text
 */
function softenClaims(text: string, forbiddenClaims: string[]): string {
  let softened = text;

  const replacements: Record<string, string> = {
    cure: 'help with',
    treat: 'support',
    diagnose: 'identify',
    prevent: 'help reduce',
    guarantee: 'designed to',
    miracle: 'amazing',
    instant: 'quick',
    overnight: 'fast',
    revolutionary: 'innovative',
  };

  forbiddenClaims.forEach((claim) => {
    const regex = new RegExp(`\\b${claim}\\b`, 'gi');
    const replacement = replacements[claim.toLowerCase()] || 'improve';
    softened = softened.replace(regex, replacement);
  });

  return softened;
}

/**
 * Validate beat timings
 */
function validateBeatTimings(beats: Beat[], targetDuration: number): string[] {
  const errors: string[] = [];

  // Check beats are sorted by order
  const sorted = [...beats].sort((a, b) => a.order - b.order);

  for (let i = 0; i < sorted.length; i++) {
    const beat = sorted[i];

    // Validate duration matches end - start
    const calculatedDuration = beat.endTime - beat.startTime;
    if (Math.abs(calculatedDuration - beat.duration) > 0.1) {
      errors.push(
        `Beat ${beat.type}: Duration mismatch. Specified ${beat.duration}s but timings show ${calculatedDuration}s`
      );
    }

    // Validate beat is within bounds
    if (beat.startTime < 0) {
      errors.push(`Beat ${beat.type}: Start time cannot be negative`);
    }

    if (beat.endTime > targetDuration) {
      errors.push(
        `Beat ${beat.type}: End time ${beat.endTime}s exceeds target duration ${targetDuration}s`
      );
    }

    // Check for gaps between beats
    if (i > 0) {
      const prevBeat = sorted[i - 1];
      const gap = beat.startTime - prevBeat.endTime;

      if (Math.abs(gap) > 0.1) {
        errors.push(
          `Gap of ${gap}s between beat ${prevBeat.type} and ${beat.type}. Beats should be continuous.`
        );
      }
    }
  }

  // Check total duration
  const lastBeat = sorted[sorted.length - 1];
  if (lastBeat && Math.abs(lastBeat.endTime - targetDuration) > 0.1) {
    errors.push(
      `Last beat ends at ${lastBeat.endTime}s but target duration is ${targetDuration}s`
    );
  }

  return errors;
}

/**
 * Quick validation check without normalization
 */
export function quickValidate(plan: Plan): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check beat order
  if (!validateBeatOrder(plan.beats, plan.constraints.requireBeatOrder)) {
    errors.push('Beat order must be HOOK → DEMO → PROOF → CTA');
  }

  // Check overlays
  for (const beat of plan.beats) {
    for (const overlay of beat.overlays) {
      if (!validateOverlayWordCount(overlay, plan.constraints.maxOverlayWords)) {
        errors.push(`Beat ${beat.type}: Overlay exceeds ${plan.constraints.maxOverlayWords} word limit`);
      }
    }

    if (beat.voiceOver && !validateVoiceOverWPS(beat.voiceOver, plan.constraints.maxVoiceOverWPS)) {
      errors.push(`Beat ${beat.type}: Voice-over exceeds ${plan.constraints.maxVoiceOverWPS} WPS`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

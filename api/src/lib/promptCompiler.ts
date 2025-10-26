import { Plan, Beat } from '../types/plan';
import { Logger } from './logger';

const logger = new Logger({ module: 'prompt-compiler' });

export interface CompiledPrompt {
  system: string;
  user: string;
  control: PromptControl;
}

export interface PromptControl {
  aspectRatio: string;
  duration: number;
  fps: number;
  resolution: string;
  seed?: number;
  beats: BeatControl[];
  brand: {
    primaryColor: string;
    secondaryColor?: string;
    style: string;
  };
  audioConfig?: {
    audioUrl?: string;
    musicVolume: number;
  };
}

export interface BeatControl {
  beatNumber: number;
  type: string;
  startTime: number;
  endTime: number;
  duration: number;
  assetUrls: string[];
  visualStyle: string;
  cameraMovement: string;
  prompt: string;
  seed?: number;
}

/**
 * Compile a plan into VEO3 preview prompt (no audio URL yet)
 */
export function compilePreviewPrompt(plan: Plan): CompiledPrompt {
  logger.info('Compiling preview prompt', {
    planId: plan.id,
    variantId: plan.variantId,
    beatCount: plan.beats.length,
  });

  const system = buildSystemPrompt(plan);
  const user = buildUserPrompt(plan, false);
  const control = buildControl(plan, undefined);

  return { system, user, control };
}

/**
 * Compile a plan into VEO3 final prompt (with audio URL)
 */
export function compileFinalPrompt(plan: Plan, audioUrl: string): CompiledPrompt {
  logger.info('Compiling final prompt', {
    planId: plan.id,
    variantId: plan.variantId,
    audioUrl,
  });

  const system = buildSystemPrompt(plan);
  const user = buildUserPrompt(plan, true);
  const control = buildControl(plan, audioUrl);

  return { system, user, control };
}

/**
 * Build system prompt with constraints and guidelines
 */
function buildSystemPrompt(plan: Plan): string {
  return `You are a professional video generation system creating ${plan.aspectRatio} social media ads.

BRAND GUIDELINES:
- Brand: ${plan.brand.name}
- Primary Color: ${plan.brand.primaryColor}
- Style: ${plan.brand.style}
${plan.brand.logoUrl ? `- Logo: Include brand logo tastefully` : ''}

VIDEO REQUIREMENTS:
- Aspect Ratio: ${plan.aspectRatio} (optimized for TikTok/Reels)
- Total Duration: ${plan.targetDuration} seconds
- Resolution: ${plan.resolution} at ${plan.fps}fps
- Format: ${plan.format.toUpperCase()}

CONTENT STRUCTURE:
The video follows a 4-beat storytelling structure:
1. HOOK (${plan.beats[0]?.duration || 6}s): Attention-grabbing opener that stops the scroll
2. DEMO (${plan.beats[1]?.duration || 6}s): Product feature demonstration
3. PROOF (${plan.beats[2]?.duration || 6}s): Social proof or benefit showcase
4. CTA (${plan.beats[3]?.duration || 6}s): Call-to-action with clear next steps

TECHNICAL CONSTRAINTS:
- Each beat must be rendered separately with scene continuity
- Use provided reference images for visual consistency
- Maintain brand colors throughout all beats
- Ensure smooth transitions between beats
- Optimize for vertical viewing experience
- Professional cinematic quality with high production value

OVERLAY TEXT REQUIREMENTS:
- Maximum ${plan.constraints.maxOverlayWords} words per text overlay
- Text must be readable on mobile devices
- High contrast between text and background
- Animations should be smooth and professional

AUDIO REQUIREMENTS:
- Voice-over pace: Maximum ${plan.constraints.maxVoiceOverWPS} words per second
- Background music: Volume at ${plan.beats[0]?.musicVolume || 0.3} (0-1 scale)
- Clear audio mix with voice-over prioritized

FORBIDDEN CONTENT:
- Do not use these claims: ${plan.constraints.forbiddenClaims.join(', ')}
- Avoid medical, legal, or unsubstantiated claims
- Keep all content truthful and verifiable

Remember: Create engaging, scroll-stopping content that tells a complete story in ${plan.targetDuration} seconds.`;
}

/**
 * Build user prompt with beat-by-beat instructions
 */
function buildUserPrompt(plan: Plan, isFinal: boolean): string {
  const promptType = isFinal ? 'FINAL' : 'PREVIEW';

  let userPrompt = `Generate a ${promptType} ${plan.aspectRatio} social media ad video for "${plan.brand.name}".

HOOK:
${plan.hookText}

CONCEPT TYPE: ${plan.conceptType.toUpperCase()}

`;

  // Add beat-by-beat instructions
  plan.beats.forEach((beat, index) => {
    userPrompt += `\nBEAT ${index + 1}: ${beat.type.toUpperCase()} (${beat.startTime}s - ${beat.endTime}s)\n`;
    userPrompt += `Duration: ${beat.duration}s\n`;
    userPrompt += `Visual Style: ${beat.visualStyle}\n`;
    userPrompt += `Camera: ${beat.cameraMovement}\n`;

    if (beat.assetRefs.length > 0) {
      userPrompt += `Reference Images: ${beat.assetRefs.map((a) => a.url).join(', ')}\n`;
    }

    if (beat.voiceOver) {
      userPrompt += `Voice-Over (${beat.voiceOver.voice}): "${beat.voiceOver.text}"\n`;
    }

    if (beat.overlays.length > 0) {
      userPrompt += `Text Overlays:\n`;
      beat.overlays.forEach((overlay, idx) => {
        userPrompt += `  ${idx + 1}. "${overlay.text}" at ${overlay.position} (${overlay.startTime}s-${overlay.endTime}s)\n`;
      });
    }

    userPrompt += `\nDetailed Prompt: ${beat.prompt}\n`;
  });

  userPrompt += `\nPRODUCTION NOTES:
- Maintain consistent brand color (${plan.brand.primaryColor}) throughout
- Ensure smooth scene transitions between beats
- Keep ${plan.brand.style} visual style consistent
- Optimize for mobile vertical viewing
- Professional cinematic quality with engaging visuals
`;

  if (isFinal) {
    userPrompt += `- Sync voice-over and overlays with generated audio track\n`;
    userPrompt += `- Add background music at ${plan.beats[0]?.musicVolume || 0.3} volume\n`;
  }

  return userPrompt;
}

/**
 * Build control payload for VEO3 API
 */
function buildControl(plan: Plan, audioUrl?: string): PromptControl {
  const control: PromptControl = {
    aspectRatio: plan.aspectRatio,
    duration: plan.targetDuration,
    fps: plan.fps,
    resolution: plan.resolution,
    beats: plan.beats.map((beat, index) => ({
      beatNumber: index + 1,
      type: beat.type,
      startTime: beat.startTime,
      endTime: beat.endTime,
      duration: beat.duration,
      assetUrls: beat.assetRefs.map((a) => a.url),
      visualStyle: beat.visualStyle,
      cameraMovement: beat.cameraMovement,
      prompt: beat.prompt,
      seed: beat.seed,
    })),
    brand: {
      primaryColor: plan.brand.primaryColor,
      secondaryColor: plan.brand.secondaryColor,
      style: plan.brand.style,
    },
  };

  if (audioUrl) {
    control.audioConfig = {
      audioUrl,
      musicVolume: plan.beats[0]?.musicVolume || 0.3,
    };
  }

  // Use first beat's seed as overall seed if available
  if (plan.beats[0]?.seed) {
    control.seed = plan.beats[0].seed;
  }

  return control;
}

/**
 * Extract beat prompts for individual VEO3 calls
 */
export function extractBeatPrompts(plan: Plan): Array<{
  beatNumber: number;
  beatType: string;
  prompt: string;
  assetUrls: string[];
  duration: number;
  seed?: number;
}> {
  return plan.beats.map((beat, index) => ({
    beatNumber: index + 1,
    beatType: beat.type,
    prompt: beat.prompt,
    assetUrls: beat.assetRefs.map((a) => a.url),
    duration: beat.duration,
    seed: beat.seed,
  }));
}

/**
 * Build scene extension prompt for chaining beats
 */
export function buildSceneExtensionPrompt(
  previousBeat: Beat,
  currentBeat: Beat,
  previousVideoUrl: string
): string {
  return `Continue seamlessly from the previous scene.

PREVIOUS BEAT: ${previousBeat.type.toUpperCase()}
- Ended with: ${previousBeat.visualStyle}

CURRENT BEAT: ${currentBeat.type.toUpperCase()} (${currentBeat.duration}s)
${currentBeat.prompt}

REQUIREMENTS:
- Maintain visual continuity with the previous scene
- Smooth transition from previous beat's ending
- Keep consistent lighting and color grading
- Match camera movement style
- Preserve brand colors (${currentBeat.assetRefs[0] ? 'use reference image for guidance' : ''})

Reference the final frame of the previous video for seamless continuation.
Previous video: ${previousVideoUrl}`;
}

/**
 * Validate compiled prompt meets VEO3 requirements
 */
export function validateCompiledPrompt(compiled: CompiledPrompt): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check system prompt length
  if (compiled.system.length > 5000) {
    errors.push(`System prompt too long: ${compiled.system.length} characters (max 5000)`);
  }

  // Check user prompt length
  if (compiled.user.length > 5000) {
    errors.push(`User prompt too long: ${compiled.user.length} characters (max 5000)`);
  }

  // Check control payload
  if (compiled.control.beats.length !== 4) {
    errors.push(`Expected 4 beats, got ${compiled.control.beats.length}`);
  }

  // Validate each beat
  compiled.control.beats.forEach((beat, index) => {
    if (beat.duration < 4 || beat.duration > 8) {
      errors.push(`Beat ${index + 1}: Duration ${beat.duration}s outside 4-8s range`);
    }

    if (beat.prompt.length > 2000) {
      errors.push(`Beat ${index + 1}: Prompt too long (${beat.prompt.length} chars, max 2000)`);
    }

    if (beat.assetUrls.length === 0) {
      errors.push(`Beat ${index + 1}: No reference assets provided`);
    }
  });

  // Validate aspect ratio
  const validAspectRatios = ['9:16', '16:9', '1:1'];
  if (!validAspectRatios.includes(compiled.control.aspectRatio)) {
    errors.push(`Invalid aspect ratio: ${compiled.control.aspectRatio}`);
  }

  // Validate resolution
  const validResolutions = ['720p', '1080p', '4k'];
  if (!validResolutions.includes(compiled.control.resolution)) {
    errors.push(`Invalid resolution: ${compiled.control.resolution}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

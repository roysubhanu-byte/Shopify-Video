import { z } from 'zod';

/**
 * Brand Kit Schema
 */
export const BrandSchema = z.object({
  name: z.string(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logoUrl: z.string().url().optional(),
  style: z.enum(['modern', 'elegant', 'playful', 'bold']),
});

export type Brand = z.infer<typeof BrandSchema>;

/**
 * Asset Reference Schema
 */
export const AssetRefSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  type: z.enum(['product', 'lifestyle', 'detail', 'unknown']),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export type AssetRef = z.infer<typeof AssetRefSchema>;

/**
 * Overlay Schema - Text that appears on screen
 */
export const OverlaySchema = z.object({
  text: z.string().max(50, 'Overlay text must be ≤50 characters'),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  position: z.enum(['top', 'center', 'bottom', 'top_left', 'top_right', 'bottom_left', 'bottom_right']),
  fontSize: z.enum(['small', 'medium', 'large', 'xlarge']).default('large'),
  style: z.enum(['bold', 'normal', 'italic']).default('bold'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  animation: z.enum(['fade', 'slide_up', 'slide_down', 'zoom', 'none']).default('fade'),
});

export type Overlay = z.infer<typeof OverlaySchema>;

/**
 * Voice-Over Schema
 */
export const VoiceOverSchema = z.object({
  text: z.string(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  voice: z.enum(['professional', 'casual', 'energetic', 'calm']).default('professional'),
  speed: z.number().min(0.5).max(2.0).default(1.0),
  pitch: z.number().min(0.5).max(2.0).default(1.0),
});

export type VoiceOver = z.infer<typeof VoiceOverSchema>;

/**
 * Beat Schema - Individual story segment (Hook, Demo, Proof, CTA)
 */
export const BeatSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['hook', 'demo', 'proof', 'cta']),
  order: z.number().int().min(0).max(3),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  duration: z.number().min(4).max(8),

  // Visual content
  assetRefs: z.array(AssetRefSchema).min(1).max(3),
  visualStyle: z.string().max(500),
  cameraMovement: z.enum(['static', 'pan', 'zoom', 'tilt', 'dolly', 'dynamic']).default('dynamic'),

  // Audio content
  voiceOver: VoiceOverSchema.optional(),
  musicVolume: z.number().min(0).max(1).default(0.3),

  // Text overlays
  overlays: z.array(OverlaySchema).max(3),

  // VEO3 specific
  prompt: z.string().max(2000),
  seed: z.number().int().positive().optional(),
});

export type Beat = z.infer<typeof BeatSchema>;

/**
 * Constraints Schema - Rules for content generation
 */
export const ConstraintsSchema = z.object({
  maxOverlayWords: z.number().int().positive().default(6),
  maxVoiceOverWPS: z.number().positive().default(2.5), // words per second
  forbiddenClaims: z.array(z.string()).default([
    'cure', 'treat', 'diagnose', 'prevent', 'guarantee',
    'miracle', 'instant', 'overnight', 'revolutionary',
  ]),
  requireBeatOrder: z.array(z.enum(['hook', 'demo', 'proof', 'cta'])).default(['hook', 'demo', 'proof', 'cta']),
  minBeatDuration: z.number().positive().default(4),
  maxBeatDuration: z.number().positive().default(8),
  totalDuration: z.number().positive().default(24),
});

export type Constraints = z.infer<typeof ConstraintsSchema>;

/**
 * Plan Schema - Complete video generation plan
 */
export const PlanSchema = z.object({
  id: z.string().uuid(),
  variantId: z.string().uuid(),
  conceptType: z.enum(['pov', 'question', 'before_after']),

  // Video specifications
  aspectRatio: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
  targetDuration: z.number().positive().default(24),
  format: z.enum(['mp4', 'mov', 'webm']).default('mp4'),
  resolution: z.enum(['720p', '1080p', '4k']).default('1080p'),
  fps: z.number().int().positive().default(30),

  // Content structure
  beats: z.array(BeatSchema).min(4).max(4),

  // Branding
  brand: BrandSchema,

  // Assets
  selectedAssets: z.array(AssetRefSchema).min(3).max(5),

  // Constraints and rules
  constraints: ConstraintsSchema.optional(),

  // Hook information
  hookId: z.string().uuid().optional(),
  hookText: z.string(),

  // Metadata
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int().positive().default(1),

  // Validation flags
  isValidated: z.boolean().default(false),
  validationErrors: z.array(z.string()).default([]),
});

export type Plan = z.infer<typeof PlanSchema>;

/**
 * Helper function to create a default constraints object
 */
export function createDefaultConstraints(): Constraints {
  return {
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

/**
 * Helper function to validate beat order
 */
export function validateBeatOrder(beats: Beat[], requiredOrder: string[]): boolean {
  const actualOrder = beats
    .sort((a, b) => a.order - b.order)
    .map((b) => b.type);

  return JSON.stringify(actualOrder) === JSON.stringify(requiredOrder);
}

/**
 * Helper function to count words in text
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Helper function to calculate words per second
 */
export function calculateWPS(text: string, durationSeconds: number): number {
  const words = countWords(text);
  return words / durationSeconds;
}

/**
 * Helper function to check for forbidden claims
 */
export function containsForbiddenClaims(text: string, forbiddenClaims: string[]): string[] {
  const lowerText = text.toLowerCase();
  return forbiddenClaims.filter((claim) => lowerText.includes(claim.toLowerCase()));
}

/**
 * Helper to validate overlay word count
 */
export function validateOverlayWordCount(overlay: Overlay, maxWords: number): boolean {
  return countWords(overlay.text) <= maxWords;
}

/**
 * Helper to validate voice-over WPS
 */
export function validateVoiceOverWPS(voiceOver: VoiceOver, maxWPS: number): boolean {
  const duration = voiceOver.endTime - voiceOver.startTime;
  const wps = calculateWPS(voiceOver.text, duration);
  return wps <= maxWPS;
}

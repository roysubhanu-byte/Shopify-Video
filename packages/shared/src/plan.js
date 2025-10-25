"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanSchema = exports.ConstraintsSchema = exports.BeatSchema = exports.VoiceOverSchema = exports.OverlaySchema = exports.AssetRefSchema = exports.BrandSchema = void 0;
exports.createDefaultConstraints = createDefaultConstraints;
exports.validateBeatOrder = validateBeatOrder;
exports.countWords = countWords;
exports.calculateWPS = calculateWPS;
exports.containsForbiddenClaims = containsForbiddenClaims;
exports.validateOverlayWordCount = validateOverlayWordCount;
exports.validateVoiceOverWPS = validateVoiceOverWPS;
const zod_1 = require("zod");
/**
 * Brand Kit Schema
 */
exports.BrandSchema = zod_1.z.object({
    name: zod_1.z.string(),
    primaryColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondaryColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    accentColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    logoUrl: zod_1.z.string().url().optional(),
    style: zod_1.z.enum(['modern', 'elegant', 'playful', 'bold']),
});
/**
 * Asset Reference Schema
 */
exports.AssetRefSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    url: zod_1.z.string().url(),
    type: zod_1.z.enum(['product', 'lifestyle', 'detail', 'unknown']),
    width: zod_1.z.number().positive().optional(),
    height: zod_1.z.number().positive().optional(),
});
/**
 * Overlay Schema - Text that appears on screen
 */
exports.OverlaySchema = zod_1.z.object({
    text: zod_1.z.string().max(50, 'Overlay text must be ≤50 characters'),
    startTime: zod_1.z.number().min(0),
    endTime: zod_1.z.number().min(0),
    position: zod_1.z.enum(['top', 'center', 'bottom', 'top_left', 'top_right', 'bottom_left', 'bottom_right']),
    fontSize: zod_1.z.enum(['small', 'medium', 'large', 'xlarge']).default('large'),
    style: zod_1.z.enum(['bold', 'normal', 'italic']).default('bold'),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
    backgroundColor: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    animation: zod_1.z.enum(['fade', 'slide_up', 'slide_down', 'zoom', 'none']).default('fade'),
});
/**
 * Voice-Over Schema
 */
exports.VoiceOverSchema = zod_1.z.object({
    text: zod_1.z.string(),
    startTime: zod_1.z.number().min(0),
    endTime: zod_1.z.number().min(0),
    voice: zod_1.z.enum(['professional', 'casual', 'energetic', 'calm']).default('professional'),
    speed: zod_1.z.number().min(0.5).max(2.0).default(1.0),
    pitch: zod_1.z.number().min(0.5).max(2.0).default(1.0),
});
/**
 * Beat Schema - Individual story segment (Hook, Demo, Proof, CTA)
 */
exports.BeatSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['hook', 'demo', 'proof', 'cta']),
    order: zod_1.z.number().int().min(0).max(3),
    startTime: zod_1.z.number().min(0),
    endTime: zod_1.z.number().min(0),
    duration: zod_1.z.number().min(4).max(8),
    // Visual content
    assetRefs: zod_1.z.array(exports.AssetRefSchema).min(1).max(3),
    visualStyle: zod_1.z.string().max(500),
    cameraMovement: zod_1.z.enum(['static', 'pan', 'zoom', 'tilt', 'dolly', 'dynamic']).default('dynamic'),
    // Audio content
    voiceOver: exports.VoiceOverSchema.optional(),
    musicVolume: zod_1.z.number().min(0).max(1).default(0.3),
    // Text overlays
    overlays: zod_1.z.array(exports.OverlaySchema).max(3),
    // VEO3 specific
    prompt: zod_1.z.string().max(2000),
    seed: zod_1.z.number().int().positive().optional(),
});
/**
 * Constraints Schema - Rules for content generation
 */
exports.ConstraintsSchema = zod_1.z.object({
    maxOverlayWords: zod_1.z.number().int().positive().default(6),
    maxVoiceOverWPS: zod_1.z.number().positive().default(2.5), // words per second
    forbiddenClaims: zod_1.z.array(zod_1.z.string()).default([
        'cure', 'treat', 'diagnose', 'prevent', 'guarantee',
        'miracle', 'instant', 'overnight', 'revolutionary',
    ]),
    requireBeatOrder: zod_1.z.array(zod_1.z.enum(['hook', 'demo', 'proof', 'cta'])).default(['hook', 'demo', 'proof', 'cta']),
    minBeatDuration: zod_1.z.number().positive().default(4),
    maxBeatDuration: zod_1.z.number().positive().default(8),
    totalDuration: zod_1.z.number().positive().default(24),
});
/**
 * Plan Schema - Complete video generation plan
 */
exports.PlanSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    variantId: zod_1.z.string().uuid(),
    conceptType: zod_1.z.enum(['pov', 'question', 'before_after']),
    // Video specifications
    aspectRatio: zod_1.z.enum(['9:16', '16:9', '1:1']).default('9:16'),
    targetDuration: zod_1.z.number().positive().default(24),
    format: zod_1.z.enum(['mp4', 'mov', 'webm']).default('mp4'),
    resolution: zod_1.z.enum(['720p', '1080p', '4k']).default('1080p'),
    fps: zod_1.z.number().int().positive().default(30),
    // Content structure
    beats: zod_1.z.array(exports.BeatSchema).min(4).max(4),
    // Branding
    brand: exports.BrandSchema,
    // Assets
    selectedAssets: zod_1.z.array(exports.AssetRefSchema).min(3).max(5),
    // Constraints and rules
    constraints: exports.ConstraintsSchema.optional(),
    // Hook information
    hookId: zod_1.z.string().uuid().optional(),
    hookText: zod_1.z.string(),
    // Metadata
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    version: zod_1.z.number().int().positive().default(1),
    // Validation flags
    isValidated: zod_1.z.boolean().default(false),
    validationErrors: zod_1.z.array(zod_1.z.string()).default([]),
});
/**
 * Helper function to create a default constraints object
 */
function createDefaultConstraints() {
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
function validateBeatOrder(beats, requiredOrder) {
    const actualOrder = beats
        .sort((a, b) => a.order - b.order)
        .map((b) => b.type);
    return JSON.stringify(actualOrder) === JSON.stringify(requiredOrder);
}
/**
 * Helper function to count words in text
 */
function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}
/**
 * Helper function to calculate words per second
 */
function calculateWPS(text, durationSeconds) {
    const words = countWords(text);
    return words / durationSeconds;
}
/**
 * Helper function to check for forbidden claims
 */
function containsForbiddenClaims(text, forbiddenClaims) {
    const lowerText = text.toLowerCase();
    return forbiddenClaims.filter((claim) => lowerText.includes(claim.toLowerCase()));
}
/**
 * Helper to validate overlay word count
 */
function validateOverlayWordCount(overlay, maxWords) {
    return countWords(overlay.text) <= maxWords;
}
/**
 * Helper to validate voice-over WPS
 */
function validateVoiceOverWPS(voiceOver, maxWPS) {
    const duration = voiceOver.endTime - voiceOver.startTime;
    const wps = calculateWPS(voiceOver.text, duration);
    return wps <= maxWPS;
}
//# sourceMappingURL=plan.js.map
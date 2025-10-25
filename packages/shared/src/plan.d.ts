import { z } from 'zod';
/**
 * Brand Kit Schema
 */
export declare const BrandSchema: z.ZodObject<{
    name: z.ZodString;
    primaryColor: z.ZodString;
    secondaryColor: z.ZodOptional<z.ZodString>;
    accentColor: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    style: z.ZodEnum<{
        modern: "modern";
        elegant: "elegant";
        playful: "playful";
        bold: "bold";
    }>;
}, z.core.$strip>;
export type Brand = z.infer<typeof BrandSchema>;
/**
 * Asset Reference Schema
 */
export declare const AssetRefSchema: z.ZodObject<{
    id: z.ZodString;
    url: z.ZodString;
    type: z.ZodEnum<{
        product: "product";
        lifestyle: "lifestyle";
        detail: "detail";
        unknown: "unknown";
    }>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type AssetRef = z.infer<typeof AssetRefSchema>;
/**
 * Overlay Schema - Text that appears on screen
 */
export declare const OverlaySchema: z.ZodObject<{
    text: z.ZodString;
    startTime: z.ZodNumber;
    endTime: z.ZodNumber;
    position: z.ZodEnum<{
        top: "top";
        center: "center";
        bottom: "bottom";
        top_left: "top_left";
        top_right: "top_right";
        bottom_left: "bottom_left";
        bottom_right: "bottom_right";
    }>;
    fontSize: z.ZodDefault<z.ZodEnum<{
        small: "small";
        medium: "medium";
        large: "large";
        xlarge: "xlarge";
    }>>;
    style: z.ZodDefault<z.ZodEnum<{
        bold: "bold";
        normal: "normal";
        italic: "italic";
    }>>;
    color: z.ZodDefault<z.ZodString>;
    backgroundColor: z.ZodOptional<z.ZodString>;
    animation: z.ZodDefault<z.ZodEnum<{
        zoom: "zoom";
        fade: "fade";
        slide_up: "slide_up";
        slide_down: "slide_down";
        none: "none";
    }>>;
}, z.core.$strip>;
export type Overlay = z.infer<typeof OverlaySchema>;
/**
 * Voice-Over Schema
 */
export declare const VoiceOverSchema: z.ZodObject<{
    text: z.ZodString;
    startTime: z.ZodNumber;
    endTime: z.ZodNumber;
    voice: z.ZodDefault<z.ZodEnum<{
        professional: "professional";
        casual: "casual";
        energetic: "energetic";
        calm: "calm";
    }>>;
    speed: z.ZodDefault<z.ZodNumber>;
    pitch: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type VoiceOver = z.infer<typeof VoiceOverSchema>;
/**
 * Beat Schema - Individual story segment (Hook, Demo, Proof, CTA)
 */
export declare const BeatSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        hook: "hook";
        demo: "demo";
        proof: "proof";
        cta: "cta";
    }>;
    order: z.ZodNumber;
    startTime: z.ZodNumber;
    endTime: z.ZodNumber;
    duration: z.ZodNumber;
    assetRefs: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        url: z.ZodString;
        type: z.ZodEnum<{
            product: "product";
            lifestyle: "lifestyle";
            detail: "detail";
            unknown: "unknown";
        }>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    visualStyle: z.ZodString;
    cameraMovement: z.ZodDefault<z.ZodEnum<{
        zoom: "zoom";
        static: "static";
        pan: "pan";
        tilt: "tilt";
        dolly: "dolly";
        dynamic: "dynamic";
    }>>;
    voiceOver: z.ZodOptional<z.ZodObject<{
        text: z.ZodString;
        startTime: z.ZodNumber;
        endTime: z.ZodNumber;
        voice: z.ZodDefault<z.ZodEnum<{
            professional: "professional";
            casual: "casual";
            energetic: "energetic";
            calm: "calm";
        }>>;
        speed: z.ZodDefault<z.ZodNumber>;
        pitch: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    musicVolume: z.ZodDefault<z.ZodNumber>;
    overlays: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        startTime: z.ZodNumber;
        endTime: z.ZodNumber;
        position: z.ZodEnum<{
            top: "top";
            center: "center";
            bottom: "bottom";
            top_left: "top_left";
            top_right: "top_right";
            bottom_left: "bottom_left";
            bottom_right: "bottom_right";
        }>;
        fontSize: z.ZodDefault<z.ZodEnum<{
            small: "small";
            medium: "medium";
            large: "large";
            xlarge: "xlarge";
        }>>;
        style: z.ZodDefault<z.ZodEnum<{
            bold: "bold";
            normal: "normal";
            italic: "italic";
        }>>;
        color: z.ZodDefault<z.ZodString>;
        backgroundColor: z.ZodOptional<z.ZodString>;
        animation: z.ZodDefault<z.ZodEnum<{
            zoom: "zoom";
            fade: "fade";
            slide_up: "slide_up";
            slide_down: "slide_down";
            none: "none";
        }>>;
    }, z.core.$strip>>;
    prompt: z.ZodString;
    seed: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type Beat = z.infer<typeof BeatSchema>;
/**
 * Constraints Schema - Rules for content generation
 */
export declare const ConstraintsSchema: z.ZodObject<{
    maxOverlayWords: z.ZodDefault<z.ZodNumber>;
    maxVoiceOverWPS: z.ZodDefault<z.ZodNumber>;
    forbiddenClaims: z.ZodDefault<z.ZodArray<z.ZodString>>;
    requireBeatOrder: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        hook: "hook";
        demo: "demo";
        proof: "proof";
        cta: "cta";
    }>>>;
    minBeatDuration: z.ZodDefault<z.ZodNumber>;
    maxBeatDuration: z.ZodDefault<z.ZodNumber>;
    totalDuration: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type Constraints = z.infer<typeof ConstraintsSchema>;
/**
 * Plan Schema - Complete video generation plan
 */
export declare const PlanSchema: z.ZodObject<{
    id: z.ZodString;
    variantId: z.ZodString;
    conceptType: z.ZodEnum<{
        pov: "pov";
        question: "question";
        before_after: "before_after";
    }>;
    aspectRatio: z.ZodDefault<z.ZodEnum<{
        "9:16": "9:16";
        "16:9": "16:9";
        "1:1": "1:1";
    }>>;
    targetDuration: z.ZodDefault<z.ZodNumber>;
    format: z.ZodDefault<z.ZodEnum<{
        mp4: "mp4";
        mov: "mov";
        webm: "webm";
    }>>;
    resolution: z.ZodDefault<z.ZodEnum<{
        "720p": "720p";
        "1080p": "1080p";
        "4k": "4k";
    }>>;
    fps: z.ZodDefault<z.ZodNumber>;
    beats: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<{
            hook: "hook";
            demo: "demo";
            proof: "proof";
            cta: "cta";
        }>;
        order: z.ZodNumber;
        startTime: z.ZodNumber;
        endTime: z.ZodNumber;
        duration: z.ZodNumber;
        assetRefs: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            url: z.ZodString;
            type: z.ZodEnum<{
                product: "product";
                lifestyle: "lifestyle";
                detail: "detail";
                unknown: "unknown";
            }>;
            width: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        visualStyle: z.ZodString;
        cameraMovement: z.ZodDefault<z.ZodEnum<{
            zoom: "zoom";
            static: "static";
            pan: "pan";
            tilt: "tilt";
            dolly: "dolly";
            dynamic: "dynamic";
        }>>;
        voiceOver: z.ZodOptional<z.ZodObject<{
            text: z.ZodString;
            startTime: z.ZodNumber;
            endTime: z.ZodNumber;
            voice: z.ZodDefault<z.ZodEnum<{
                professional: "professional";
                casual: "casual";
                energetic: "energetic";
                calm: "calm";
            }>>;
            speed: z.ZodDefault<z.ZodNumber>;
            pitch: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>>;
        musicVolume: z.ZodDefault<z.ZodNumber>;
        overlays: z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            startTime: z.ZodNumber;
            endTime: z.ZodNumber;
            position: z.ZodEnum<{
                top: "top";
                center: "center";
                bottom: "bottom";
                top_left: "top_left";
                top_right: "top_right";
                bottom_left: "bottom_left";
                bottom_right: "bottom_right";
            }>;
            fontSize: z.ZodDefault<z.ZodEnum<{
                small: "small";
                medium: "medium";
                large: "large";
                xlarge: "xlarge";
            }>>;
            style: z.ZodDefault<z.ZodEnum<{
                bold: "bold";
                normal: "normal";
                italic: "italic";
            }>>;
            color: z.ZodDefault<z.ZodString>;
            backgroundColor: z.ZodOptional<z.ZodString>;
            animation: z.ZodDefault<z.ZodEnum<{
                zoom: "zoom";
                fade: "fade";
                slide_up: "slide_up";
                slide_down: "slide_down";
                none: "none";
            }>>;
        }, z.core.$strip>>;
        prompt: z.ZodString;
        seed: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    brand: z.ZodObject<{
        name: z.ZodString;
        primaryColor: z.ZodString;
        secondaryColor: z.ZodOptional<z.ZodString>;
        accentColor: z.ZodOptional<z.ZodString>;
        logoUrl: z.ZodOptional<z.ZodString>;
        style: z.ZodEnum<{
            modern: "modern";
            elegant: "elegant";
            playful: "playful";
            bold: "bold";
        }>;
    }, z.core.$strip>;
    selectedAssets: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        url: z.ZodString;
        type: z.ZodEnum<{
            product: "product";
            lifestyle: "lifestyle";
            detail: "detail";
            unknown: "unknown";
        }>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    constraints: z.ZodOptional<z.ZodObject<{
        maxOverlayWords: z.ZodDefault<z.ZodNumber>;
        maxVoiceOverWPS: z.ZodDefault<z.ZodNumber>;
        forbiddenClaims: z.ZodDefault<z.ZodArray<z.ZodString>>;
        requireBeatOrder: z.ZodDefault<z.ZodArray<z.ZodEnum<{
            hook: "hook";
            demo: "demo";
            proof: "proof";
            cta: "cta";
        }>>>;
        minBeatDuration: z.ZodDefault<z.ZodNumber>;
        maxBeatDuration: z.ZodDefault<z.ZodNumber>;
        totalDuration: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    hookId: z.ZodOptional<z.ZodString>;
    hookText: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    isValidated: z.ZodDefault<z.ZodBoolean>;
    validationErrors: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type Plan = z.infer<typeof PlanSchema>;
/**
 * Helper function to create a default constraints object
 */
export declare function createDefaultConstraints(): Constraints;
/**
 * Helper function to validate beat order
 */
export declare function validateBeatOrder(beats: Beat[], requiredOrder: string[]): boolean;
/**
 * Helper function to count words in text
 */
export declare function countWords(text: string): number;
/**
 * Helper function to calculate words per second
 */
export declare function calculateWPS(text: string, durationSeconds: number): number;
/**
 * Helper function to check for forbidden claims
 */
export declare function containsForbiddenClaims(text: string, forbiddenClaims: string[]): string[];
/**
 * Helper to validate overlay word count
 */
export declare function validateOverlayWordCount(overlay: Overlay, maxWords: number): boolean;
/**
 * Helper to validate voice-over WPS
 */
export declare function validateVoiceOverWPS(voiceOver: VoiceOver, maxWPS: number): boolean;
//# sourceMappingURL=plan.d.ts.map
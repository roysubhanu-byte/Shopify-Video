import { Logger } from './logger';

const logger = new Logger({ module: 'brand-style-presets' });

export type BrandStyleName =
  | 'professional'
  | 'energetic'
  | 'luxury'
  | 'casual'
  | 'minimal'
  | 'bold'
  | 'playful'
  | 'authoritative'
  | 'cinematic'
  | 'ugc';

export type CameraStyle = 'static' | 'dynamic' | 'handheld' | 'cinematic' | 'smooth' | 'locked';

export type ProductPlacement = 'center' | 'rule-of-thirds' | 'hero-left' | 'hero-right' | 'floating';

export type TextStyle = 'minimal' | 'bold' | 'elegant' | 'playful' | 'modern';

export type PacingSpeed = 'slow' | 'medium' | 'fast' | 'dynamic';

export interface CompositionRules {
  productPlacement: ProductPlacement;
  textStyle: TextStyle;
  pacing: PacingSpeed;
  shotVariety: 'static' | 'varied' | 'dynamic';
  lightingStyle: 'natural' | 'studio' | 'dramatic' | 'soft';
  depthOfField: 'shallow' | 'deep' | 'medium';
}

export interface BrandStylePreset {
  id: string;
  name: BrandStyleName;
  displayName: string;
  description: string;
  colorPalette: {
    primary: string[];
    secondary: string[];
    accent: string[];
    background: string[];
  };
  cameraStyle: CameraStyle;
  compositionRules: CompositionRules;
  examplePrompts: {
    hook: string[];
    demo: string[];
    proof: string[];
    cta: string[];
  };
  veo3Controls: {
    aspectRatio: '9:16';
    fps: 30;
    styleModifiers: string[];
    cameraInstructions: string[];
    lightingInstructions: string[];
  };
  targetAudience: string[];
  bestFor: string[];
}

export class BrandStylePresetsManager {
  private presets: Map<BrandStyleName, BrandStylePreset>;

  constructor() {
    this.presets = new Map();
    this.initializePresets();
  }

  private initializePresets(): void {
    const professional: BrandStylePreset = {
      id: 'professional',
      name: 'professional',
      displayName: 'Professional',
      description: 'Clean, trustworthy, and corporate. Perfect for B2B, SaaS, and professional services.',
      colorPalette: {
        primary: ['#1E3A8A', '#2563EB', '#3B82F6'],
        secondary: ['#64748B', '#94A3B8', '#CBD5E1'],
        accent: ['#0EA5E9', '#06B6D4', '#14B8A6'],
        background: ['#FFFFFF', '#F8FAFC', '#F1F5F9'],
      },
      cameraStyle: 'static',
      compositionRules: {
        productPlacement: 'center',
        textStyle: 'minimal',
        pacing: 'medium',
        shotVariety: 'static',
        lightingStyle: 'studio',
        depthOfField: 'deep',
      },
      examplePrompts: {
        hook: [
          'Clean, professional product showcase on white background',
          'Business professional using product in modern office',
          'Product floating in minimalist studio environment',
        ],
        demo: [
          'Smooth product rotation showing key features',
          'Close-up of interface with clean typography',
          'Professional hands demonstrating product usage',
        ],
        proof: [
          'Customer testimonial in corporate setting',
          'Data visualization showing results',
          'Before/after comparison with clean graphics',
        ],
        cta: [
          'Product packshot with company logo and URL',
          'Call-to-action button with professional design',
          'End card with contact information',
        ],
      },
      veo3Controls: {
        aspectRatio: '9:16',
        fps: 30,
        styleModifiers: [
          'professional lighting',
          'clean composition',
          'corporate aesthetic',
          'high-end production quality',
        ],
        cameraInstructions: [
          'locked camera',
          'subtle push-in',
          'steady handheld',
        ],
        lightingInstructions: [
          'even studio lighting',
          'soft shadows',
          'bright and clear',
        ],
      },
      targetAudience: ['B2B buyers', 'Corporate decision-makers', 'Professionals'],
      bestFor: ['SaaS products', 'Business services', 'Corporate tools', 'Financial products'],
    };

    const energetic: BrandStylePreset = {
      id: 'energetic',
      name: 'energetic',
      displayName: 'Energetic',
      description: 'Fast-paced, vibrant, and exciting. Perfect for fitness, sports, and youth-oriented brands.',
      colorPalette: {
        primary: ['#DC2626', '#EF4444', '#F97316'],
        secondary: ['#FBBF24', '#FCD34D', '#FDE047'],
        accent: ['#EC4899', '#F59E0B', '#10B981'],
        background: ['#1F2937', '#111827', '#18181B'],
      },
      cameraStyle: 'dynamic',
      compositionRules: {
        productPlacement: 'hero-left',
        textStyle: 'bold',
        pacing: 'fast',
        shotVariety: 'dynamic',
        lightingStyle: 'dramatic',
        depthOfField: 'shallow',
      },
      examplePrompts: {
        hook: [
          'Dynamic action shot with product in motion',
          'Athlete using product with intense energy',
          'Fast-paced montage of product benefits',
        ],
        demo: [
          'Quick cuts showing product features in action',
          'High-energy demonstration with vibrant colors',
          'Product being used in exciting environment',
        ],
        proof: [
          'User testimonial with dynamic editing',
          'Before/after transformation with energy',
          'Results montage with upbeat pacing',
        ],
        cta: [
          'Bold call-to-action with motion graphics',
          'Product burst onto screen with energy',
          'Exciting end card with clear CTA',
        ],
      },
      veo3Controls: {
        aspectRatio: '9:16',
        fps: 30,
        styleModifiers: [
          'high energy',
          'vibrant colors',
          'dynamic motion',
          'fast-paced editing',
        ],
        cameraInstructions: [
          'whip pan',
          'fast push-in',
          'handheld shake',
          'orbit shot',
        ],
        lightingInstructions: [
          'dramatic lighting',
          'high contrast',
          'colorful gels',
        ],
      },
      targetAudience: ['Gen Z', 'Millennials', 'Active lifestyle enthusiasts'],
      bestFor: ['Fitness products', 'Sports equipment', 'Energy drinks', 'Gaming gear'],
    };

    const luxury: BrandStylePreset = {
      id: 'luxury',
      name: 'luxury',
      displayName: 'Luxury',
      description: 'Elegant, sophisticated, and premium. Perfect for high-end fashion, jewelry, and luxury goods.',
      colorPalette: {
        primary: ['#1C1917', '#292524', '#44403C'],
        secondary: ['#A78BFA', '#C4B5FD', '#DDD6FE'],
        accent: ['#D4AF37', '#E5C100', '#F4E4C1'],
        background: ['#FAFAF9', '#F5F5F4', '#E7E5E4'],
      },
      cameraStyle: 'cinematic',
      compositionRules: {
        productPlacement: 'rule-of-thirds',
        textStyle: 'elegant',
        pacing: 'slow',
        shotVariety: 'varied',
        lightingStyle: 'dramatic',
        depthOfField: 'shallow',
      },
      examplePrompts: {
        hook: [
          'Elegant product reveal with soft lighting',
          'Luxury lifestyle scene with product featured',
          'Slow-motion beauty shot of product details',
        ],
        demo: [
          'Graceful product rotation in premium setting',
          'Close-up of craftsmanship and materials',
          'Elegant hands showcasing product features',
        ],
        proof: [
          'Sophisticated testimonial in upscale environment',
          'Lifestyle imagery showing aspirational use',
          'Heritage and craftsmanship storytelling',
        ],
        cta: [
          'Refined product packshot with elegant branding',
          'Subtle call-to-action with premium design',
          'Minimalist end card with boutique aesthetic',
        ],
      },
      veo3Controls: {
        aspectRatio: '9:16',
        fps: 30,
        styleModifiers: [
          'cinematic lighting',
          'premium quality',
          'elegant composition',
          'sophisticated aesthetic',
        ],
        cameraInstructions: [
          'slow push-in',
          'smooth orbit',
          'locked camera with depth',
        ],
        lightingInstructions: [
          'dramatic side lighting',
          'soft key light',
          'rim lighting for depth',
        ],
      },
      targetAudience: ['Affluent consumers', 'Luxury buyers', 'Fashion enthusiasts'],
      bestFor: ['Jewelry', 'High-end fashion', 'Luxury watches', 'Premium cosmetics'],
    };

    const ugc: BrandStylePreset = {
      id: 'ugc',
      name: 'ugc',
      displayName: 'UGC / Authentic',
      description: 'Raw, relatable, and authentic. Perfect for direct-to-consumer brands and social-first products.',
      colorPalette: {
        primary: ['#EF4444', '#F59E0B', '#10B981'],
        secondary: ['#6B7280', '#9CA3AF', '#D1D5DB'],
        accent: ['#8B5CF6', '#EC4899', '#06B6D4'],
        background: ['#FFFFFF', '#F9FAFB', '#F3F4F6'],
      },
      cameraStyle: 'handheld',
      compositionRules: {
        productPlacement: 'floating',
        textStyle: 'playful',
        pacing: 'dynamic',
        shotVariety: 'varied',
        lightingStyle: 'natural',
        depthOfField: 'medium',
      },
      examplePrompts: {
        hook: [
          'POV: Person discovering product in daily life',
          'Authentic unboxing moment with genuine reaction',
          'Real person testing product for first time',
        ],
        demo: [
          'Casual demonstration in home environment',
          'Honest review of product features',
          'Real-life usage scenario with natural lighting',
        ],
        proof: [
          'Genuine before/after transformation',
          'Real customer sharing honest results',
          'Day-in-the-life showing product impact',
        ],
        cta: [
          'Personal recommendation to try product',
          'Authentic end card with swipe-up prompt',
          'Real person encouraging action',
        ],
      },
      veo3Controls: {
        aspectRatio: '9:16',
        fps: 30,
        styleModifiers: [
          'authentic feel',
          'natural lighting',
          'relatable content',
          'user-generated aesthetic',
        ],
        cameraInstructions: [
          'handheld camera',
          'selfie angle',
          'casual framing',
        ],
        lightingInstructions: [
          'natural window light',
          'ambient indoor lighting',
          'no studio setup',
        ],
      },
      targetAudience: ['Social media users', 'Millennials', 'Gen Z consumers'],
      bestFor: ['D2C products', 'Beauty products', 'Lifestyle brands', 'Subscriptions'],
    };

    this.presets.set('professional', professional);
    this.presets.set('energetic', energetic);
    this.presets.set('luxury', luxury);
    this.presets.set('ugc', ugc);

    logger.info('Brand style presets initialized', {
      count: this.presets.size,
      styles: Array.from(this.presets.keys()),
    });
  }

  getPreset(name: BrandStyleName): BrandStylePreset | null {
    return this.presets.get(name) || null;
  }

  getAllPresets(): BrandStylePreset[] {
    return Array.from(this.presets.values());
  }

  applyPresetToPrompt(
    basePrompt: string,
    presetName: BrandStyleName,
    beatType: 'hook' | 'demo' | 'proof' | 'cta'
  ): string {
    const preset = this.getPreset(presetName);
    if (!preset) {
      logger.warn('Preset not found, using base prompt', { presetName });
      return basePrompt;
    }

    const styleModifiers = preset.veo3Controls.styleModifiers.join(', ');
    const cameraInstructions = preset.veo3Controls.cameraInstructions[0];
    const lightingInstructions = preset.veo3Controls.lightingInstructions[0];

    const enhancedPrompt = `${basePrompt}. Style: ${styleModifiers}. Camera: ${cameraInstructions}. Lighting: ${lightingInstructions}. Composition follows ${preset.compositionRules.productPlacement} rule with ${preset.compositionRules.pacing} pacing.`;

    logger.info('Applied preset to prompt', {
      presetName,
      beatType,
      originalLength: basePrompt.length,
      enhancedLength: enhancedPrompt.length,
    });

    return enhancedPrompt;
  }

  getPresetRecommendation(productCategory: string, targetAudience: string): BrandStyleName {
    const categoryMap: Record<string, BrandStyleName> = {
      'saas': 'professional',
      'software': 'professional',
      'business': 'professional',
      'fitness': 'energetic',
      'sports': 'energetic',
      'gaming': 'energetic',
      'jewelry': 'luxury',
      'fashion': 'luxury',
      'watches': 'luxury',
      'beauty': 'ugc',
      'skincare': 'ugc',
      'supplements': 'ugc',
    };

    const lowerCategory = productCategory.toLowerCase();
    for (const [key, style] of Object.entries(categoryMap)) {
      if (lowerCategory.includes(key)) {
        logger.info('Preset recommended based on category', {
          category: productCategory,
          recommended: style,
        });
        return style;
      }
    }

    logger.info('No specific recommendation, defaulting to professional', {
      category: productCategory,
    });
    return 'professional';
  }
}

export const brandStylePresetsManager = new BrandStylePresetsManager();

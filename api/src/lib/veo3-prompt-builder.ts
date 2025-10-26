import { Logger } from './logger';
import { Concept } from './concept-factory';
import { BrandKit } from './brand-kit';
import { ProductData } from './ingest';

const logger = new Logger({ module: 'veo3-prompt-builder' });

export interface BeatPrompt {
  beatNumber: number;
  beatType: 'hook' | 'demo_1' | 'demo_2' | 'cta';
  prompt: string;
  duration: number;
  referenceImageUrls: string[];
}

export interface HookVariables {
  product: string;
  benefit: string;
  pain: string;
  gain: string;
  feature_1: string;
  feature_2: string;
  category: string;
  timeframe: string;
  audience: string;
  result: string;
  alternative: string;
}

/**
 * Extract hook variables from product data
 */
export function extractHookVariables(product: ProductData, brandKit: BrandKit): HookVariables {
  const bullets = product.bullets || [];

  // Extract benefits (first 3 bullet points)
  const benefits = bullets.slice(0, 3).map((b) => b.replace(/^[•\-\*]\s*/, '').trim());

  // Extract pain points (look for negatives)
  const pains: string[] = [];
  for (const bullet of bullets) {
    const lower = bullet.toLowerCase();
    if (lower.includes('no more') || lower.includes('stop') || lower.includes('eliminate') || lower.includes('without')) {
      pains.push(bullet.replace(/^[•\-\*]\s*/, '').trim());
    }
  }

  // Determine category from title
  const titleLower = product.title.toLowerCase();
  let category = 'product';
  if (titleLower.includes('software') || titleLower.includes('app')) category = 'software';
  else if (titleLower.includes('beauty') || titleLower.includes('skin')) category = 'beauty';
  else if (titleLower.includes('fitness') || titleLower.includes('workout')) category = 'fitness';
  else if (titleLower.includes('home') || titleLower.includes('kitchen')) category = 'home';

  return {
    product: brandKit.brandName || product.title,
    benefit: benefits[0] || 'amazing results',
    pain: pains[0] || 'old problems',
    gain: benefits[0] || 'success',
    feature_1: benefits[0] || 'premium quality',
    feature_2: benefits[1] || 'easy to use',
    category,
    timeframe: 'days',
    audience: 'smart shoppers',
    result: 'great outcomes',
    alternative: 'regular options',
  };
}

/**
 * Fill hook template with product variables
 */
export function fillHookTemplate(template: string, variables: HookVariables): string {
  return template
    .replace(/{product}/g, variables.product)
    .replace(/{benefit}/g, variables.benefit)
    .replace(/{pain}/g, variables.pain)
    .replace(/{gain}/g, variables.gain)
    .replace(/{feature_1}/g, variables.feature_1)
    .replace(/{feature_2}/g, variables.feature_2)
    .replace(/{category}/g, variables.category)
    .replace(/{timeframe}/g, variables.timeframe)
    .replace(/{audience}/g, variables.audience)
    .replace(/{result}/g, variables.result)
    .replace(/{alternative}/g, variables.alternative);
}

/**
 * Build VEO3 prompts for all 4 beats of a concept
 */
export function buildConceptPrompts(
  concept: Concept,
  product: ProductData,
  brandKit: BrandKit,
  selectedImageUrls: string[],
  hookText: string,
  brandTonePrompt?: string,
  targetMarket?: string
): BeatPrompt[] {
  logger.info('Building prompts for concept', {
    conceptId: concept.id,
    conceptType: concept.hookPattern,
    hookText,
    imageCount: selectedImageUrls.length,
    brandTone: brandTonePrompt ? 'custom' : 'default',
    targetMarket: targetMarket || 'Global',
  });

  const primaryColor = brandKit.palette.primary;
  const styleDirective = getStyleDirective(concept, brandKit, brandTonePrompt, targetMarket);
  const productSpecificity = getProductSpecificity(product.title);

  // Ensure we have at least 4 images (repeat if necessary)
  const images = [...selectedImageUrls];
  while (images.length < 4) {
    images.push(selectedImageUrls[images.length % selectedImageUrls.length]);
  }

  const prompts: BeatPrompt[] = [];

  // BEAT 1: Hook (3 seconds)
  prompts.push({
    beatNumber: 1,
    beatType: 'hook',
    duration: 6,
    referenceImageUrls: [images[0]],
    prompt: `Create a vertical 9:16 video opening scene. ${hookText}. ${productSpecificity}. Show ${product.title} prominently in an attention-grabbing way. Use ${primaryColor} as the primary brand accent color throughout. ${styleDirective}. High energy start that stops the scroll. Smooth camera movement. Professional cinematic lighting. The scene should feel dynamic and engaging from the first frame. Reference product styling and composition from the provided image.`,
  });

  // BEAT 2: Demo Part 1 (3-4 seconds)
  const feature1 = concept.script.demo.steps[0]?.text || 'Amazing features you love';
  prompts.push({
    beatNumber: 2,
    beatType: 'demo_1',
    duration: 6,
    referenceImageUrls: [images[1]],
    prompt: `Continue seamlessly from the previous scene. Now showcase this key feature: ${feature1}. Show ${product.title} in action with smooth transitions. Maintain the ${primaryColor} brand color theme. ${styleDirective}. The camera should move fluidly to reveal product details. Demonstrate the product benefit clearly and compellingly. Keep the energy high and maintain visual continuity with the opening. Use the reference image for product appearance and context.`,
  });

  // BEAT 3: Demo Part 2 (3-4 seconds)
  const feature2 = concept.script.demo.steps[1]?.text || 'Outstanding quality and design';
  prompts.push({
    beatNumber: 3,
    beatType: 'demo_2',
    duration: 6,
    referenceImageUrls: [images[2]],
    prompt: `Build on the previous scene with smooth continuity. Now demonstrate: ${feature2}. Show ${product.title} in an aspirational lifestyle context. The scene should feel elevated and desirable. Maintain consistent ${primaryColor} brand colors and lighting. ${styleDirective}. The viewer should feel they need this product. Show the transformation or benefit clearly. Smooth camera movements that feel cinematic. Reference the provided image for lifestyle context and product styling.`,
  });

  // BEAT 4: CTA (2-3 seconds)
  const ctaText = concept.script.cta.text;
  const socialProof = concept.script.proof.text;
  prompts.push({
    beatNumber: 4,
    beatType: 'cta',
    duration: 6,
    referenceImageUrls: [images[3]],
    prompt: `Final scene that completes the story. Show ${product.title} as a hero product shot with clean composition. Leave clear space at the bottom third of frame for text overlay with call-to-action: "${ctaText}". Include visual cue for social proof: ${socialProof}. Brand colors ${primaryColor} should be prominent. The scene should feel confident, complete, and compelling. ${styleDirective}. Clean, uncluttered composition perfect for final message. Camera should settle into a stable, confident final frame. Use reference image for product presentation.`,
  });

  logger.info('Generated prompts for all beats', {
    conceptId: concept.id,
    beatCount: prompts.length,
    totalDuration: prompts.reduce((sum, p) => sum + p.duration, 0),
  });

  return prompts;
}

/**
 * Get style directive based on concept and brand
 */
function getStyleDirective(concept: Concept, brandKit: BrandKit, brandTonePrompt?: string, targetMarket?: string): string {
  const baseStyle = 'Cinematic composition, professional lighting, smooth camera movements, high production value';

  const verticalStyle =
    concept.vertical === 'saas'
      ? 'Tech product showcase aesthetic, modern UI elements, screen-like overlays, digital feel'
      : concept.vertical === 'ecommerce'
      ? 'Premium product photography style, aspirational lifestyle imagery, magazine quality'
      : 'Motivational visual language, personal transformation vibe, inspiring atmosphere';

  const conceptStyle = concept.style;

  const brandTone = brandTonePrompt || brandKit.style || 'premium, authentic, engaging';

  const regionalStyle = getRegionalStyle(targetMarket || 'Global');

  return `${baseStyle}. ${verticalStyle}. ${conceptStyle}. Brand tone: ${brandTone}. ${regionalStyle}. Shot in vertical 9:16 format optimized for TikTok and Instagram Reels.`;
}

/**
 * Get regional style based on target market
 */
function getRegionalStyle(targetMarket: string): string {
  const regionalStyles: Record<string, string> = {
    India: 'Urban Indian setting, contemporary Indian lifestyle, relatable to Indian audience with authentic representation',
    USA: 'American urban/suburban setting, diverse modern American lifestyle',
    'Middle East': 'Modern Middle Eastern urban setting, modest contemporary fashion, respectful cultural representation',
    Europe: 'European urban setting, stylish European lifestyle aesthetic',
    Global: 'Universal modern urban setting, globally relatable lifestyle',
  };

  return regionalStyles[targetMarket] || regionalStyles.Global;
}

/**
 * Get product-specific requirements
 */
function getProductSpecificity(productTitle: string): string {
  const titleLower = productTitle.toLowerCase();

  const specificityMap: Record<string, string> = {
    gelato: 'Italian gelato in authentic glass cup with visible creamy texture, NOT soft serve ice cream, NOT ice cream cone',
    'ice cream': 'Premium ice cream properly served, show texture and quality',
    sneakers: 'Athletic sneakers on feet in action, NOT dress shoes, NOT boots',
    laptop: 'Modern laptop with visible screen, NOT tablet, NOT desktop',
    skincare: 'Skincare serum bottle with dropper, NOT cream jar',
    phone: 'Smartphone in hand with screen visible, NOT tablet',
    headphones: 'Wireless headphones being worn, show comfort and quality',
    watch: 'Wristwatch on wrist in lifestyle context, NOT laying flat',
  };

  for (const [key, specificity] of Object.entries(specificityMap)) {
    if (titleLower.includes(key)) {
      return specificity;
    }
  }

  return `Show ${productTitle} accurately and prominently`;
}

/**
 * Validate prompts before sending to VEO3
 */
export function validatePrompts(prompts: BeatPrompt[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (prompts.length !== 4) {
    errors.push(`Expected 4 beats, got ${prompts.length}`);
  }

  prompts.forEach((prompt, index) => {
    if (prompt.beatNumber !== index + 1) {
      errors.push(`Beat ${index + 1} has incorrect beat number: ${prompt.beatNumber}`);
    }

    if (!prompt.prompt || prompt.prompt.length < 50) {
      errors.push(`Beat ${index + 1} prompt is too short or empty`);
    }

    if (prompt.prompt.length > 2000) {
      errors.push(`Beat ${index + 1} prompt exceeds 2000 character limit`);
    }

    if (prompt.duration < 4 || prompt.duration > 8) {
      errors.push(`Beat ${index + 1} duration ${prompt.duration}s is outside 4-8s range`);
    }

    if (!prompt.referenceImageUrls || prompt.referenceImageUrls.length === 0) {
      errors.push(`Beat ${index + 1} has no reference images`);
    }

    // Check for template variables that weren't replaced
    if (prompt.prompt.includes('{') && prompt.prompt.includes('}')) {
      errors.push(`Beat ${index + 1} contains unreplaced template variables`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

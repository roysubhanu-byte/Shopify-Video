import { Logger } from './logger';

const logger = new Logger({ module: 'manual-prompt-compiler' });

export interface ProductData {
  url: string;
  title: string;
  description: string;
  bullets: string[];
  price: string;
  currency: string;
  images: string[];
  brandName: string;
  brandColors: string[];
}

export interface EnhancedPrompt {
  fullPrompt: string;
  productSpecificity: string;
  regionalContext: string;
  characterConsistency: string;
  overlayInstructions: string;
  shotSequence: string;
  visualStyle: string;
}

interface RegionalSpec {
  character: string;
  setting: string;
  cultural: string;
  wardrobe: string;
}

const REGIONAL_SPECS: Record<string, RegionalSpec> = {
  India: {
    character: 'Young Indian woman, 20s, contemporary Indian or western outfit',
    setting: 'Urban Indian environment (modern cafe, home, or office)',
    cultural: 'Show relatable Indian lifestyle context with authentic representation',
    wardrobe: 'Kurta, salwar kameez, or modern western wear appropriate for Indian context',
  },
  USA: {
    character: 'Diverse American woman, 20s, casual modern style',
    setting: 'American urban or suburban setting',
    cultural: 'Contemporary American lifestyle',
    wardrobe: 'Casual modern American fashion',
  },
  'Middle East': {
    character: 'Young woman in modest contemporary fashion',
    setting: 'Modern Middle Eastern urban environment',
    cultural: 'Respectful cultural representation with modest styling',
    wardrobe: 'Modest contemporary fashion appropriate for Middle Eastern context',
  },
  Europe: {
    character: 'Young European woman, 20s, stylish casual wear',
    setting: 'European urban setting',
    cultural: 'Contemporary European lifestyle',
    wardrobe: 'European street style fashion',
  },
  Global: {
    character: 'Young woman, 20s, modern casual outfit',
    setting: 'Contemporary urban setting',
    cultural: 'Universal modern lifestyle',
    wardrobe: 'Modern casual fashion',
  },
};

const PRODUCT_SPECIFICITY_MAP: Record<string, string> = {
  gelato: 'Italian gelato in authentic glass cup with visible creamy texture, NOT soft serve ice cream, NOT ice cream cone',
  'ice cream': 'Premium ice cream served properly, show texture and quality',
  sneakers: 'Athletic sneakers on feet in action, NOT dress shoes, NOT boots, show cushioning and design details',
  laptop: 'Modern laptop with visible screen showing interface, NOT tablet, NOT desktop monitor',
  skincare: 'Skincare serum bottle with dropper application, NOT cream jar, show premium packaging',
  phone: 'Smartphone in hand showing screen clearly, NOT tablet, highlight design and features',
  headphones: 'Wireless headphones being worn, NOT earbuds unless specified, show comfort and quality',
  watch: 'Wristwatch on wrist in lifestyle context, NOT laying flat, show face and band details',
  sunglasses: 'Sunglasses being worn on face, NOT on head or table, show lens quality and fit',
  bag: 'Handbag or backpack being carried or worn, show capacity and quality details',
  shoes: 'Footwear being worn in appropriate context, show fit and comfort',
  jacket: 'Outerwear being worn, show fit and fabric quality',
  dress: 'Dress being worn in lifestyle setting, show fit and fabric movement',
};

export function compileManualPrompt(input: {
  userPrompt: string;
  product: ProductData;
  brandName: string;
  brandColors: string[];
  brandTonePrompt?: string;
  targetMarket?: string;
}): EnhancedPrompt {
  logger.info('Compiling manual prompt', {
    userPromptLength: input.userPrompt.length,
    targetMarket: input.targetMarket || 'Global',
    hasBrandTone: !!input.brandTonePrompt,
  });

  const targetMarket = input.targetMarket || 'Global';
  const primaryColor = input.brandColors[0] || '#000000';

  const productSpec = buildProductSpecificity(input.product);
  const regionalContext = buildRegionalContext(targetMarket, input.brandTonePrompt);
  const characterConsistency = buildCharacterConsistency(targetMarket);
  const overlayInstructions = buildOverlayInstructions(input.userPrompt, primaryColor);
  const shotSequence = buildShotSequence(input.userPrompt, input.product, targetMarket);
  const visualStyle = buildVisualStyle(input.brandTonePrompt, targetMarket, primaryColor);

  const fullPrompt = `
PROFESSIONAL VIDEO ADVERTISEMENT - 9:16 VERTICAL FORMAT

USER CONCEPT: ${input.userPrompt}

${productSpec}

${regionalContext}

${characterConsistency}

${overlayInstructions}

${shotSequence}

${visualStyle}

TECHNICAL REQUIREMENTS:
- Format: 9:16 vertical video optimized for TikTok, Reels, Shorts
- Duration: 24 seconds total (4 beats of 6 seconds each)
- Smooth camera movements, professional cinematography
- Consistent lighting and color grading throughout
- High production value, premium feel
- Brand colors (${primaryColor}) prominently featured
- Maintain visual continuity between all shots

BRAND ALIGNMENT:
- Brand: ${input.brandName}
- Tone: ${input.brandTonePrompt || 'Premium, authentic, engaging'}
- Target Audience: ${targetMarket}

Remember: Create scroll-stopping content that tells a complete story while staying true to the user's vision: "${input.userPrompt}"
`.trim();

  logger.info('Manual prompt compiled successfully', {
    fullPromptLength: fullPrompt.length,
    productType: detectProductType(input.product.title),
  });

  return {
    fullPrompt,
    productSpecificity: productSpec,
    regionalContext,
    characterConsistency,
    overlayInstructions,
    shotSequence,
    visualStyle,
  };
}

function buildProductSpecificity(product: ProductData): string {
  const productType = detectProductType(product.title);
  const specificityRule = PRODUCT_SPECIFICITY_MAP[productType];

  if (specificityRule) {
    return `
PRODUCT SPECIFICITY (CRITICAL):
- Show ${product.title} exactly as described
- ${specificityRule}
- Reference product images for accurate styling
- Maintain consistent product appearance throughout
- Show product in use, not just displayed
- Highlight key features: ${product.bullets[0] || 'premium quality'}
`.trim();
  }

  return `
PRODUCT SPECIFICITY:
- Feature ${product.title} prominently and accurately
- Show product in realistic use context
- Maintain consistent product appearance
- Highlight: ${product.bullets.slice(0, 2).join(', ') || 'quality and design'}
`.trim();
}

function buildRegionalContext(targetMarket: string, brandTonePrompt?: string): string {
  const regional = REGIONAL_SPECS[targetMarket] || REGIONAL_SPECS.Global;

  return `
REGIONAL TARGETING - ${targetMarket.toUpperCase()}:
CHARACTER PROFILE:
- ${regional.character}
- Wardrobe: ${regional.wardrobe}
- Age range: 20-30 years old
- Authentic representation with genuine expressions

SETTING:
- ${regional.setting}
- ${regional.cultural}
- Natural lighting appropriate for location
- Lifestyle context that resonates with ${targetMarket} audience

CULTURAL CONSIDERATIONS:
- Respect cultural norms and values
- Show relatable, aspirational lifestyle
- Authentic representation, avoid stereotypes
`.trim();
}

function buildCharacterConsistency(targetMarket: string): string {
  const regional = REGIONAL_SPECS[targetMarket] || REGIONAL_SPECS.Global;

  return `
CHARACTER CONSISTENCY (CRITICAL):
- SAME PERSON appears in ALL shots throughout the video
- ${regional.character}
- Same outfit, hairstyle, and appearance in every scene
- If showing multiple angles, ensure seamless continuity
- Use continuous footage or perfectly matched cuts
- NO character changes mid-video
- Consistent facial features, expressions, and styling
- Maintain character's relationship with product across all beats
`.trim();
}

function buildOverlayInstructions(userPrompt: string, primaryColor: string): string {
  const hookWords = userPrompt.split(' ').slice(0, 6).join(' ');

  return `
TEXT OVERLAYS (MUST APPEAR - CRITICAL):
HOOK OVERLAY (0-6 seconds):
- Text: "${hookWords}" (first 6 words of concept)
- Position: Top center of frame
- Font: Bold sans-serif, 60pt size
- Color: White (#FFFFFF) with black shadow/outline for readability
- Animation: Fade in at 0.5s, hold until 5.5s, fade out
- Must be clearly legible on mobile screens

FEATURE OVERLAY (6-12 seconds):
- Show key product benefit as text
- Position: Center or bottom third
- Font: Bold, 50pt size
- Color: White with brand color (${primaryColor}) background
- Animation: Slide up or fade in

CTA OVERLAY (18-24 seconds):
- Text: "Get Yours Now" or "Shop Now"
- Position: Bottom center
- Font: Extra bold, 70pt size
- Color: White on brand color (${primaryColor}) button
- Animation: Zoom in or pulse for emphasis

BRAND WATERMARK (0-24 seconds):
- Brand logo or name in bottom-right corner
- Size: Small, unobtrusive (15% opacity)
- Always visible but not distracting

IMPORTANT: If VEO3 cannot render text, overlays will be burned in post-production. Design scenes with clear space for text placement.
`.trim();
}

function buildShotSequence(userPrompt: string, product: ProductData, targetMarket: string): string {
  const regional = REGIONAL_SPECS[targetMarket] || REGIONAL_SPECS.Global;

  return `
SHOT SEQUENCE (4 BEATS):

BEAT 1 - HOOK (0-6 seconds):
- Open with attention-grabbing shot that captures the concept: "${userPrompt}"
- Close-up or dynamic angle of ${product.title}
- ${regional.character} reacting or interacting with product
- High energy, immediate visual impact
- Camera movement: Dynamic push-in or reveal
- Leave space at top for hook text overlay

BEAT 2 - DEMONSTRATION (6-12 seconds):
- Show product feature: ${product.bullets[0] || 'key benefit'}
- ${regional.character} using/enjoying the product
- Medium shot showing context and interaction
- Smooth camera movement (pan or glide)
- Transition seamlessly from Beat 1
- Leave space for feature text overlay

BEAT 3 - EMOTIONAL RESPONSE (12-18 seconds):
- Wide shot showing ${regional.character} in ${regional.setting}
- Show satisfaction, joy, or transformation
- Product visible in lifestyle context
- Camera movement: Smooth zoom or orbit
- Aspirational, relatable moment
- Build emotional connection with viewer

BEAT 4 - CALL TO ACTION (18-24 seconds):
- Hero product shot with clean composition
- ${product.title} featured prominently
- ${regional.character} confident and satisfied
- Camera settles into stable, confident final frame
- Clear space at bottom for CTA text overlay
- End on strong, memorable visual
`.trim();
}

function buildVisualStyle(brandTonePrompt: string | undefined, targetMarket: string, primaryColor: string): string {
  const baseTone = brandTonePrompt || 'premium, authentic, engaging';
  const regional = REGIONAL_SPECS[targetMarket] || REGIONAL_SPECS.Global;

  return `
VISUAL STYLE:
BRAND TONE: ${baseTone}
- Professional cinematography with cinematic composition
- ${regional.cultural}
- Color grading: Warm, inviting tones with ${primaryColor} as brand accent
- Lighting: Natural and flattering, golden hour quality if outdoors
- Camera work: Smooth, intentional movements (no shaky handheld)

AESTHETIC:
- High production value, magazine-quality imagery
- Clean, uncluttered compositions
- Depth of field for professional look
- Consistent color palette throughout
- Modern, aspirational feel
- Premium product presentation

PACING:
- Dynamic opening to stop the scroll
- Smooth transitions between beats
- Build emotional momentum
- Strong, confident ending
- Overall rhythm: Engaging but not rushed
`.trim();
}

function detectProductType(title: string): string {
  const titleLower = title.toLowerCase();

  const typeMap: [string, string[]][] = [
    ['gelato', ['gelato', 'gelati']],
    ['ice cream', ['ice cream', 'icecream']],
    ['sneakers', ['sneaker', 'trainer', 'running shoe', 'athletic shoe']],
    ['laptop', ['laptop', 'notebook computer', 'macbook']],
    ['skincare', ['serum', 'moisturizer', 'cream', 'cleanser', 'toner', 'skincare']],
    ['phone', ['phone', 'smartphone', 'iphone', 'android']],
    ['headphones', ['headphones', 'headset', 'over-ear']],
    ['watch', ['watch', 'smartwatch', 'timepiece']],
    ['sunglasses', ['sunglasses', 'shades', 'eyewear']],
    ['bag', ['bag', 'handbag', 'purse', 'tote', 'backpack']],
    ['shoes', ['shoes', 'boots', 'sandals', 'heels']],
    ['jacket', ['jacket', 'coat', 'blazer']],
    ['dress', ['dress', 'gown']],
  ];

  for (const [type, keywords] of typeMap) {
    if (keywords.some((keyword) => titleLower.includes(keyword))) {
      return type;
    }
  }

  return 'product';
}

export function validateManualPrompt(userPrompt: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!userPrompt || userPrompt.trim().length === 0) {
    errors.push('User prompt cannot be empty');
  }

  if (userPrompt.length < 10) {
    errors.push('User prompt is too short. Please provide more detail about your vision.');
  }

  if (userPrompt.length > 500) {
    errors.push('User prompt is too long. Please keep it under 500 characters.');
  }

  const wordCount = userPrompt.trim().split(/\s+/).length;
  if (wordCount < 3) {
    errors.push('User prompt must contain at least 3 words');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

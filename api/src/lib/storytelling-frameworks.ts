import { Logger } from './logger';

const logger = new Logger({ module: 'storytelling-frameworks' });

/**
 * Storytelling Framework Types
 * Each framework represents a proven narrative structure for video ads
 */
export type FrameworkType =
  | 'pain_solution'
  | 'transformation'
  | 'social_proof'
  | 'value_prop'
  | 'curiosity_reveal'
  | 'lifestyle_aspiration';

export interface StorytellingFramework {
  id: FrameworkType;
  name: string;
  description: string;
  bestFor: string[];
  structure: {
    hook: string;
    demo: string;
    proof: string;
    cta: string;
  };
  examplePrompt: string;
  visualStyle: string;
  emotionalArc: string;
}

/**
 * Product category definitions for better targeting
 */
export type ProductCategory =
  | 'beauty'
  | 'fitness'
  | 'fashion'
  | 'tech'
  | 'home'
  | 'jewelry'
  | 'food'
  | 'lifestyle'
  | 'wellness'
  | 'general';

/**
 * Complete storytelling frameworks library
 */
export const STORYTELLING_FRAMEWORKS: Record<FrameworkType, StorytellingFramework> = {
  pain_solution: {
    id: 'pain_solution',
    name: 'Pain → Solution',
    description: 'Start with a relatable problem, then reveal your product as the perfect solution',
    bestFor: ['beauty', 'fitness', 'wellness', 'tech', 'home'],
    structure: {
      hook: 'Open with the pain point - show the struggle, frustration, or problem your audience faces daily',
      demo: 'Introduce your product as the solution - demonstrate how it directly addresses the pain',
      proof: 'Show the relief and results - transformation from pain to satisfaction',
      cta: 'Make it easy to solve their problem - clear call to action with urgency',
    },
    examplePrompt: 'Tired of [pain]? Watch how [product] transforms your [category] routine in seconds. No more [frustration], just [benefit].',
    visualStyle: 'Start with muted, frustrated tones, transition to bright, satisfied visuals',
    emotionalArc: 'Frustration → Hope → Relief → Satisfaction',
  },

  transformation: {
    id: 'transformation',
    name: 'Before → After Transformation',
    description: 'Show the dramatic change from "before" state to amazing "after" results',
    bestFor: ['fitness', 'beauty', 'fashion', 'home', 'lifestyle'],
    structure: {
      hook: 'Show the "before" state - what life looks like without your product',
      demo: 'The transformation moment - your product in action creating change',
      proof: 'The amazing "after" - show the dramatic improvement and new reality',
      cta: 'Start your transformation - invite viewers to begin their own journey',
    },
    examplePrompt: 'My [category] before vs after [product]. The difference is unbelievable. Watch the transformation that changed everything.',
    visualStyle: 'Split screen or sequential showing clear contrast, dramatic before/after lighting',
    emotionalArc: 'Dissatisfaction → Curiosity → Excitement → Inspiration',
  },

  social_proof: {
    id: 'social_proof',
    name: 'Social Proof & FOMO',
    description: 'Leverage popularity, testimonials, and fear of missing out',
    bestFor: ['fashion', 'beauty', 'lifestyle', 'jewelry', 'tech'],
    structure: {
      hook: 'Everyone is talking about this - create FOMO and curiosity',
      demo: 'Show why it\'s trending - demonstrate what makes it special',
      proof: 'Real people, real results - authentic testimonials or social validation',
      cta: 'Join the movement - don\'t be left behind',
    },
    examplePrompt: 'Why is everyone obsessed with [product]? I tried it and now I understand. Here\'s what [X] people discovered.',
    visualStyle: 'Dynamic, energetic, community-focused visuals with multiple perspectives',
    emotionalArc: 'Curiosity → Discovery → Validation → Belonging',
  },

  value_prop: {
    id: 'value_prop',
    name: 'Value Proposition Story',
    description: 'Focus on unique benefits and what makes your product special',
    bestFor: ['tech', 'home', 'wellness', 'general'],
    structure: {
      hook: 'What if you could [amazing benefit]? - promise the value',
      demo: 'Here\'s how it works - showcase unique features and benefits',
      proof: 'Real value delivered - demonstrate ROI or tangible benefits',
      cta: 'Experience the difference - try it for yourself',
    },
    examplePrompt: 'What makes [product] different? Three features that change everything: [feature 1], [feature 2], and [feature 3].',
    visualStyle: 'Clean, professional, feature-focused with clear benefit visualization',
    emotionalArc: 'Interest → Understanding → Conviction → Action',
  },

  curiosity_reveal: {
    id: 'curiosity_reveal',
    name: 'Curiosity → Big Reveal',
    description: 'Build intrigue and curiosity, then deliver an exciting reveal',
    bestFor: ['tech', 'beauty', 'jewelry', 'lifestyle', 'food'],
    structure: {
      hook: 'Create mystery - tease something amazing without showing everything',
      demo: 'Build anticipation - slowly reveal features that increase curiosity',
      proof: 'The big reveal - show the wow moment and amazing payoff',
      cta: 'Discover it yourself - invite them to experience the reveal',
    },
    examplePrompt: 'You won\'t believe what [product] can do. Wait for it... The secret that changes [category] forever.',
    visualStyle: 'Mysterious opening, dramatic lighting, building momentum to climactic reveal',
    emotionalArc: 'Curiosity → Anticipation → Surprise → Delight',
  },

  lifestyle_aspiration: {
    id: 'lifestyle_aspiration',
    name: 'Lifestyle & Aspiration',
    description: 'Show the aspirational lifestyle your product enables',
    bestFor: ['fashion', 'jewelry', 'lifestyle', 'wellness', 'home'],
    structure: {
      hook: 'Paint the picture - show the aspirational lifestyle or moment',
      demo: 'Your product as the key - how it enables this lifestyle',
      proof: 'Living the dream - show authentic enjoyment and satisfaction',
      cta: 'Elevate your life - invite them to upgrade their lifestyle',
    },
    examplePrompt: 'This is what [lifestyle goal] looks like with [product]. Elevate your [category] game and live your best life.',
    visualStyle: 'Aspirational, magazine-quality imagery, golden hour lighting, elegant composition',
    emotionalArc: 'Aspiration → Desire → Connection → Empowerment',
  },
};

/**
 * Detect product category from product data
 */
export function detectProductCategory(productData: {
  title: string;
  description: string;
  bullets: string[];
}): ProductCategory {
  const allText = [
    productData.title,
    productData.description,
    ...productData.bullets,
  ]
    .join(' ')
    .toLowerCase();

  const categoryKeywords: Record<ProductCategory, string[]> = {
    beauty: [
      'skin', 'makeup', 'cosmetic', 'serum', 'cream', 'beauty', 'skincare',
      'moisturizer', 'cleanser', 'facial', 'lip', 'nail', 'hair care',
    ],
    fitness: [
      'fitness', 'workout', 'exercise', 'gym', 'athletic', 'training',
      'muscle', 'cardio', 'protein', 'weights', 'yoga', 'running',
    ],
    fashion: [
      'clothing', 'apparel', 'dress', 'shirt', 'pants', 'shoes', 'outfit',
      'fashion', 'wear', 'style', 'jacket', 'coat', 'boots', 'sneakers',
    ],
    tech: [
      'tech', 'electronic', 'digital', 'software', 'app', 'device', 'gadget',
      'smart', 'wireless', 'bluetooth', 'charging', 'laptop', 'phone',
    ],
    home: [
      'home', 'kitchen', 'furniture', 'decor', 'interior', 'living',
      'bedroom', 'bathroom', 'appliance', 'cleaning', 'organization',
    ],
    jewelry: [
      'jewelry', 'ring', 'necklace', 'bracelet', 'earring', 'gold', 'silver',
      'diamond', 'gemstone', 'pendant', 'chain', 'watch', 'accessories',
    ],
    food: [
      'food', 'snack', 'nutrition', 'organic', 'protein', 'meal', 'coffee',
      'tea', 'supplement', 'vitamin', 'drink', 'beverage', 'healthy eating',
    ],
    wellness: [
      'wellness', 'health', 'meditation', 'sleep', 'relaxation', 'stress',
      'mental health', 'mindfulness', 'therapy', 'recovery', 'self-care',
    ],
    lifestyle: [
      'lifestyle', 'travel', 'adventure', 'experience', 'luxury', 'premium',
      'outdoor', 'hobby', 'collection', 'exclusive', 'artisan',
    ],
    general: [],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'general') continue;

    const matchCount = keywords.filter(keyword => allText.includes(keyword)).length;
    if (matchCount >= 2) {
      return category as ProductCategory;
    }
  }

  return 'general';
}

/**
 * Get recommended frameworks for a product category
 */
export function getRecommendedFrameworks(category: ProductCategory): FrameworkType[] {
  const recommendations: Record<ProductCategory, FrameworkType[]> = {
    beauty: ['transformation', 'pain_solution', 'social_proof'],
    fitness: ['transformation', 'pain_solution', 'lifestyle_aspiration'],
    fashion: ['lifestyle_aspiration', 'social_proof', 'transformation'],
    tech: ['value_prop', 'curiosity_reveal', 'pain_solution'],
    home: ['transformation', 'value_prop', 'pain_solution'],
    jewelry: ['lifestyle_aspiration', 'curiosity_reveal', 'social_proof'],
    food: ['curiosity_reveal', 'social_proof', 'lifestyle_aspiration'],
    wellness: ['pain_solution', 'transformation', 'lifestyle_aspiration'],
    lifestyle: ['lifestyle_aspiration', 'social_proof', 'curiosity_reveal'],
    general: ['value_prop', 'pain_solution', 'social_proof'],
  };

  return recommendations[category] || recommendations.general;
}

/**
 * Generate framework-based prompt guidance
 */
export function generateFrameworkGuidance(
  framework: FrameworkType,
  productData: {
    title: string;
    description: string;
    bullets: string[];
    category?: ProductCategory;
  }
): string {
  const fw = STORYTELLING_FRAMEWORKS[framework];
  const category = productData.category || detectProductCategory(productData);

  const guidance = `
STORYTELLING FRAMEWORK: ${fw.name.toUpperCase()}
${fw.description}

NARRATIVE STRUCTURE:
1. HOOK (0-6s): ${fw.structure.hook}
2. DEMONSTRATION (6-12s): ${fw.structure.demo}
3. PROOF (12-18s): ${fw.structure.proof}
4. CALL-TO-ACTION (18-24s): ${fw.structure.cta}

EMOTIONAL ARC: ${fw.emotionalArc}

VISUAL STYLE: ${fw.visualStyle}

EXAMPLE APPROACH:
${fw.examplePrompt}

YOUR PRODUCT CONTEXT:
- Product: ${productData.title}
- Category: ${category}
- Key Benefits: ${productData.bullets.slice(0, 3).join(', ')}

Remember: Follow this narrative structure to create a compelling story that resonates with your audience.
`.trim();

  logger.info('Generated framework guidance', {
    framework,
    category,
    productTitle: productData.title,
  });

  return guidance;
}

/**
 * Enhance user prompt with framework-based improvements
 */
export function enhancePromptWithFramework(
  userPrompt: string,
  framework: FrameworkType,
  productData: {
    title: string;
    description: string;
    bullets: string[];
    category?: ProductCategory;
  }
): string {
  const fw = STORYTELLING_FRAMEWORKS[framework];
  const category = productData.category || detectProductCategory(productData);

  // Extract key elements from user prompt
  const userWords = userPrompt.toLowerCase();
  const mentions = {
    problem: userWords.includes('problem') || userWords.includes('pain') || userWords.includes('struggle'),
    solution: userWords.includes('solution') || userWords.includes('solve') || userWords.includes('fix'),
    transformation: userWords.includes('transform') || userWords.includes('before') || userWords.includes('after'),
    lifestyle: userWords.includes('lifestyle') || userWords.includes('life') || userWords.includes('living'),
  };

  let enhanced = `${userPrompt}\n\n`;
  enhanced += `Apply ${fw.name} storytelling framework:\n`;
  enhanced += `- Emotional Arc: ${fw.emotionalArc}\n`;
  enhanced += `- Visual Style: ${fw.visualStyle}\n`;
  enhanced += `\n`;
  enhanced += `Structure the video following this narrative:\n`;
  enhanced += `Beat 1: ${fw.structure.hook}\n`;
  enhanced += `Beat 2: ${fw.structure.demo}\n`;
  enhanced += `Beat 3: ${fw.structure.proof}\n`;
  enhanced += `Beat 4: ${fw.structure.cta}\n`;

  logger.info('Enhanced prompt with framework', {
    framework,
    originalLength: userPrompt.length,
    enhancedLength: enhanced.length,
    mentions,
  });

  return enhanced;
}

/**
 * Validate if user prompt aligns with chosen framework
 */
export function validatePromptFrameworkAlignment(
  userPrompt: string,
  framework: FrameworkType
): { aligned: boolean; suggestions: string[] } {
  const fw = STORYTELLING_FRAMEWORKS[framework];
  const suggestions: string[] = [];
  const promptLower = userPrompt.toLowerCase();

  // Check for framework-specific elements
  switch (framework) {
    case 'pain_solution':
      if (!promptLower.includes('problem') && !promptLower.includes('pain') && !promptLower.includes('struggle')) {
        suggestions.push('Consider mentioning the problem or pain point your product solves');
      }
      if (!promptLower.includes('solution') && !promptLower.includes('solve') && !promptLower.includes('fix')) {
        suggestions.push('Highlight how your product provides the solution');
      }
      break;

    case 'transformation':
      if (!promptLower.includes('before') && !promptLower.includes('after') && !promptLower.includes('transform')) {
        suggestions.push('Emphasize the transformation journey - what changes from before to after');
      }
      break;

    case 'social_proof':
      if (!promptLower.includes('everyone') && !promptLower.includes('people') && !promptLower.includes('customer')) {
        suggestions.push('Reference social validation - what others are saying or experiencing');
      }
      break;

    case 'curiosity_reveal':
      if (!promptLower.includes('secret') && !promptLower.includes('discover') && !promptLower.includes('reveal')) {
        suggestions.push('Build curiosity with mystery language - tease the reveal');
      }
      break;
  }

  const aligned = suggestions.length === 0;

  return { aligned, suggestions };
}

/**
 * Get all frameworks suitable for a product
 */
export function getFrameworksForProduct(productData: {
  title: string;
  description: string;
  bullets: string[];
}): Array<StorytellingFramework & { recommended: boolean }> {
  const category = detectProductCategory(productData);
  const recommended = getRecommendedFrameworks(category);

  return Object.values(STORYTELLING_FRAMEWORKS).map(fw => ({
    ...fw,
    recommended: recommended.includes(fw.id),
  }));
}

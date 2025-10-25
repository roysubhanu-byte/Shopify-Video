import { ProductData } from './ingest';
import { BrandKit } from './brand-kit';
import { Logger } from './logger';

const logger = new Logger({ module: 'concept-factory' });

export interface Concept {
  id: 'A' | 'B' | 'C';
  label: string;
  seed: number;
  hookPattern: string;
  hookExample: string;
  script: {
    hook: { text: string; duration: number };
    demo: {
      steps: Array<{ text: string; duration: number }>;
    };
    proof: { text: string; duration: number };
    cta: { text: string; duration: number };
  };
  style: string;
  vertical: 'saas' | 'ecommerce' | 'coaching';
}

const HOOK_TEMPLATES = {
  POV: [
    'POV: You just discovered {product}',
    'POV: You finally found {benefit}',
    'POV: You stopped settling for {pain}',
    'POV: This changed everything',
  ],
  Question: [
    'Why is everyone obsessed with {product}?',
    'What if {benefit} was this easy?',
    'How do {audience} get {result}?',
    'Is this the secret to {benefit}?',
  ],
  BeforeAfter: [
    'From {pain} to {gain} in {timeframe}',
    'Before: {pain}. After: {gain}',
    'Stop {pain}, start {benefit}',
    '{pain} vs. {benefit} - choose wisely',
  ],
};

function determineVertical(product: ProductData): Concept['vertical'] {
  const text = (product.title + ' ' + product.description + ' ' + product.bullets.join(' ')).toLowerCase();

  if (
    text.includes('software') ||
    text.includes('app') ||
    text.includes('platform') ||
    text.includes('automation') ||
    text.includes('dashboard') ||
    text.includes('analytics')
  ) {
    return 'saas';
  }

  if (
    text.includes('course') ||
    text.includes('training') ||
    text.includes('coaching') ||
    text.includes('learn') ||
    text.includes('masterclass') ||
    text.includes('transform')
  ) {
    return 'coaching';
  }

  return 'ecommerce';
}

function extractPainPoints(bullets: string[]): string[] {
  const pains: string[] = [];

  for (const bullet of bullets) {
    const lower = bullet.toLowerCase();
    if (lower.includes('no more') || lower.includes('stop') || lower.includes('eliminate')) {
      pains.push(bullet);
    }
  }

  if (pains.length === 0) {
    pains.push('wasted time', 'frustration', 'complexity');
  }

  return pains;
}

function extractBenefits(bullets: string[]): string[] {
  const benefits = bullets.slice(0, 3).map((b) => {
    return b.replace(/^[•\-\*]\s*/, '').trim();
  });

  if (benefits.length === 0) {
    benefits.push('better results', 'more efficiency', 'improved performance');
  }

  return benefits;
}

function fillTemplate(template: string, product: ProductData, brandKit: BrandKit): string {
  const benefits = extractBenefits(product.bullets);
  const pains = extractPainPoints(product.bullets);

  return template
    .replace('{product}', brandKit.brandName)
    .replace('{benefit}', benefits[0] || 'amazing results')
    .replace('{pain}', pains[0] || 'old problems')
    .replace('{gain}', benefits[0] || 'success')
    .replace('{result}', benefits[1] || 'great outcomes')
    .replace('{audience}', 'smart shoppers')
    .replace('{timeframe}', 'days');
}

function generateConceptA(product: ProductData, brandKit: BrandKit, vertical: Concept['vertical']): Concept {
  const template = HOOK_TEMPLATES.POV[0];
  const hookText = fillTemplate(template, product, brandKit);
  const benefits = extractBenefits(product.bullets);

  return {
    id: 'A',
    label: 'POV / UGC Style',
    seed: 341991,
    hookPattern: 'POV',
    hookExample: template,
    script: {
      hook: {
        text: hookText,
        duration: 3,
      },
      demo: {
        steps: [
          { text: benefits[0] || 'See the difference', duration: 3 },
          { text: benefits[1] || 'Experience the quality', duration: 3 },
        ],
      },
      proof: {
        text: product.reviews
          ? `${product.reviews.average}/5 stars from ${product.reviews.count}+ customers`
          : 'Trusted by thousands',
        duration: 2,
      },
      cta: {
        text: 'Shop now',
        duration: 2,
      },
    },
    style: 'authentic UGC, handheld camera, relatable, conversational tone',
    vertical,
  };
}

function generateConceptB(product: ProductData, brandKit: BrandKit, vertical: Concept['vertical']): Concept {
  const template = HOOK_TEMPLATES.Question[0];
  const hookText = fillTemplate(template, product, brandKit);
  const benefits = extractBenefits(product.bullets);

  return {
    id: 'B',
    label: 'Question / Explainer',
    seed: 911223,
    hookPattern: 'Question',
    hookExample: template,
    script: {
      hook: {
        text: hookText,
        duration: 3,
      },
      demo: {
        steps: [
          { text: `Here's why: ${benefits[0]}`, duration: 3 },
          { text: `Plus: ${benefits[1] || 'unbeatable quality'}`, duration: 3 },
        ],
      },
      proof: {
        text: `Join ${product.reviews?.count || 'thousands'} happy customers`,
        duration: 2,
      },
      cta: {
        text: 'Try it today',
        duration: 2,
      },
    },
    style: 'educational, clear, product showcase, smooth transitions',
    vertical,
  };
}

function generateConceptC(product: ProductData, brandKit: BrandKit, vertical: Concept['vertical']): Concept {
  const template = HOOK_TEMPLATES.BeforeAfter[0];
  const hookText = fillTemplate(template, product, brandKit);
  const benefits = extractBenefits(product.bullets);
  const pains = extractPainPoints(product.bullets);

  return {
    id: 'C',
    label: 'Before/After / Lifestyle',
    seed: 557731,
    hookPattern: 'Before-After',
    hookExample: template,
    script: {
      hook: {
        text: hookText,
        duration: 3,
      },
      demo: {
        steps: [
          { text: `Before: ${pains[0] || 'struggling with old solutions'}`, duration: 3 },
          { text: `After: ${benefits[0] || 'living your best life'}`, duration: 3 },
        ],
      },
      proof: {
        text: `Real results, real people`,
        duration: 2,
      },
      cta: {
        text: 'Get yours now',
        duration: 2,
      },
    },
    style: 'aspirational lifestyle, split-screen before/after, dramatic transformation',
    vertical,
  };
}

export async function generate3Concepts(
  product: ProductData,
  brandKit: BrandKit
): Promise<Concept[]> {
  logger.info('Generating 3 concepts', {
    product: product.title,
    brand: brandKit.brandName,
  });

  const vertical = determineVertical(product);

  const concepts = [
    generateConceptA(product, brandKit, vertical),
    generateConceptB(product, brandKit, vertical),
    generateConceptC(product, brandKit, vertical),
  ];

  logger.info('3 concepts generated', {
    vertical,
    patterns: concepts.map((c) => c.hookPattern),
    seeds: concepts.map((c) => c.seed),
  });

  return concepts;
}

export function getStyleDirective(concept: Concept, brandKit: BrandKit): string {
  const baseStyle = `cinematic composition, professional lighting, ${brandKit.palette.primary} brand color`;

  const verticalStyle =
    concept.vertical === 'saas'
      ? 'tech product showcase, screen recordings, modern UI'
      : concept.vertical === 'ecommerce'
      ? 'product photography, lifestyle shots, aspirational'
      : 'motivational visuals, personal transformation, inspiring';

  return `${baseStyle}, ${verticalStyle}, ${concept.style}, smooth transitions, dynamic camera movements`;
}

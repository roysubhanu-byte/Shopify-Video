/**
 * Prompt Helper Functions
 * Utilities for building and filling prompt templates
 */

export interface HookVariables {
  productName: string;
  brandName: string;
  productCategory?: string;
  primaryBenefit?: string;
  targetAudience?: string;
  pricePoint?: string;
  uniqueFeature?: string;
  pain?: string;
  alternative?: string;
}

/**
 * Extract hook variables from product and brand kit data
 */
export function extractHookVariables(product: any, brandKit: any): HookVariables {
  const variables: HookVariables = {
    productName: product.title || product.name || 'this product',
    brandName: brandKit?.brand_name || product.brand_name || 'our brand',
  };

  // Extract product category from title or description
  if (product.title) {
    const categoryMatch = product.title.match(/\b(shoes?|shirt|dress|watch|phone|laptop|headphones?|bag|backpack|jacket|pants)\b/i);
    if (categoryMatch) {
      variables.productCategory = categoryMatch[0].toLowerCase();
    }
  }

  // Extract primary benefit from bullets or description
  if (product.bullets && product.bullets.length > 0) {
    variables.primaryBenefit = product.bullets[0];
  } else if (product.description) {
    const desc = product.description.substring(0, 100);
    variables.primaryBenefit = desc;
  }

  // Extract target audience from brand kit
  if (brandKit?.target_market) {
    variables.targetAudience = brandKit.target_market;
  }

  // Extract price point
  if (product.price) {
    if (product.price < 50) {
      variables.pricePoint = 'affordable';
    } else if (product.price < 200) {
      variables.pricePoint = 'mid-range';
    } else {
      variables.pricePoint = 'premium';
    }
  }

  // Extract unique feature from bullets
  if (product.bullets && product.bullets.length > 1) {
    variables.uniqueFeature = product.bullets[1];
  }

  return variables;
}

/**
 * Fill a hook template with variables
 */
export function fillHookTemplate(template: string, variables: HookVariables): string {
  let filled = template;

  // Replace all variable placeholders
  for (const [key, value] of Object.entries(variables)) {
    if (value) {
      // Replace {{variableName}} with actual value
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
      filled = filled.replace(placeholder, value);
    }
  }

  // Remove any remaining unfilled placeholders
  filled = filled.replace(/\{\{[^}]+\}\}/g, '');

  return filled.trim();
}

/**
 * Build concept prompts from template and product data
 */
export function buildConceptPrompts(
  concepts: any[],
  product: any,
  brandKit: any
): any[] {
  const variables = extractHookVariables(product, brandKit);

  return concepts.map((concept) => {
    if (concept.hook_template) {
      return {
        ...concept,
        filled_hook: fillHookTemplate(concept.hook_template, variables),
      };
    }
    return concept;
  });
}

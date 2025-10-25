import { supabase } from './supabase';
import { Logger } from './logger';
import { ProductData } from './ingest';
import { BrandKit } from './brand-kit';
import { extractHookVariables, fillHookTemplate, type HookVariables } from './veo3-prompt-builder';

const logger = new Logger({ module: 'hooks-service' });

export interface TrendingHook {
  id: string;
  hook_text: string;
  hook_type: 'pov' | 'question' | 'before_after' | 'curiosity' | 'problem_solution' | 'exclusive';
  hook_template: string;
  platform: 'tiktok' | 'reels' | 'both';
  product_category: string | null;
  engagement_score: number;
  is_active: boolean;
  created_at: string;
}

export interface RecommendedHook extends TrendingHook {
  filled_text: string;
  compatibility_score: number;
  variables: HookVariables;
}

/**
 * Get all trending hooks from the library
 */
export async function getAllHooks(): Promise<TrendingHook[]> {
  try {
    const { data, error } = await supabase
      .from('trending_hooks_library')
      .select('*')
      .eq('is_active', true)
      .order('engagement_score', { ascending: false });

    if (error) {
      logger.error('Failed to fetch hooks', { error });
      throw error;
    }

    return data as TrendingHook[];
  } catch (error) {
    logger.error('Error getting hooks', { error });
    throw error;
  }
}

/**
 * Get hooks filtered by type
 */
export async function getHooksByType(hookType: string): Promise<TrendingHook[]> {
  try {
    const { data, error } = await supabase
      .from('trending_hooks_library')
      .select('*')
      .eq('is_active', true)
      .eq('hook_type', hookType)
      .order('engagement_score', { ascending: false });

    if (error) {
      logger.error('Failed to fetch hooks by type', { hookType, error });
      throw error;
    }

    return data as TrendingHook[];
  } catch (error) {
    logger.error('Error getting hooks by type', { error });
    throw error;
  }
}

/**
 * Calculate compatibility score between hook and product
 */
function calculateCompatibilityScore(
  hook: TrendingHook,
  product: ProductData,
  variables: HookVariables
): number {
  let score = hook.engagement_score; // Base score from hook performance

  // Boost score if hook type matches product characteristics
  const titleLower = product.title.toLowerCase();
  const descLower = (product.description || '').toLowerCase();
  const bulletsText = (product.bullets || []).join(' ').toLowerCase();
  const allText = `${titleLower} ${descLower} ${bulletsText}`;

  // POV hooks work well for lifestyle products
  if (hook.hook_type === 'pov') {
    if (allText.includes('lifestyle') || allText.includes('experience') || allText.includes('feeling')) {
      score += 5;
    }
  }

  // Question hooks work well for innovative products
  if (hook.hook_type === 'question') {
    if (allText.includes('new') || allText.includes('innovative') || allText.includes('revolutionary')) {
      score += 5;
    }
  }

  // Before-after hooks work well for transformation products
  if (hook.hook_type === 'before_after') {
    if (allText.includes('transform') || allText.includes('improve') || allText.includes('upgrade')) {
      score += 5;
    }
  }

  // Problem-solution hooks work well when pain points are clear
  if (hook.hook_type === 'problem_solution') {
    if (variables.pain !== 'old problems' && variables.pain.length > 10) {
      score += 5;
    }
  }

  // Curiosity hooks work well for unique features
  if (hook.hook_type === 'curiosity') {
    if (allText.includes('unique') || allText.includes('secret') || allText.includes('exclusive')) {
      score += 5;
    }
  }

  // Check if template variables can be filled meaningfully
  const templateVars = hook.hook_template.match(/{([^}]+)}/g) || [];
  let meaningfulVars = 0;

  for (const varWithBraces of templateVars) {
    const varName = varWithBraces.replace(/[{}]/g, '') as keyof HookVariables;
    const value = variables[varName];

    // Check if variable has meaningful content (not default/placeholder)
    if (value && value.length > 3 && !value.includes('old') && !value.includes('regular')) {
      meaningfulVars++;
    }
  }

  const varCompletionRatio = templateVars.length > 0 ? meaningfulVars / templateVars.length : 1;
  score += varCompletionRatio * 10;

  // Penalize if hook mentions missing variables
  if (hook.hook_template.includes('{alternative}') && variables.alternative === 'regular options') {
    score -= 5;
  }

  // Platform bonus - TikTok performs slightly better for viral hooks
  if (hook.platform === 'tiktok') {
    score += 2;
  }

  return Math.min(Math.max(score, 0), 100); // Clamp between 0-100
}

/**
 * Get recommended hooks for a concept type
 */
export async function getRecommendedHooks(
  conceptType: 'pov' | 'question' | 'before_after',
  product: ProductData,
  brandKit: BrandKit,
  limit: number = 3
): Promise<RecommendedHook[]> {
  logger.info('Getting recommended hooks', {
    conceptType,
    productTitle: product.title,
    limit,
  });

  try {
    // Map concept type to hook types
    const hookTypeMap: Record<string, string[]> = {
      pov: ['pov', 'exclusive'],
      question: ['question', 'curiosity'],
      before_after: ['before_after', 'problem_solution'],
    };

    const hookTypes = hookTypeMap[conceptType] || [conceptType];

    // Get all hooks of relevant types
    const { data: hooks, error } = await supabase
      .from('trending_hooks_library')
      .select('*')
      .eq('is_active', true)
      .in('hook_type', hookTypes)
      .order('engagement_score', { ascending: false });

    if (error) {
      logger.error('Failed to fetch hooks', { error });
      throw error;
    }

    // Extract variables from product
    const variables = extractHookVariables(product, brandKit);

    // Score and fill each hook
    const recommendedHooks: RecommendedHook[] = hooks.map((hook: TrendingHook) => {
      const compatibilityScore = calculateCompatibilityScore(hook, product, variables);
      const filledText = fillHookTemplate(hook.hook_template, variables);

      return {
        ...hook,
        filled_text: filledText,
        compatibility_score: compatibilityScore,
        variables,
      };
    });

    // Sort by compatibility score and return top N
    recommendedHooks.sort((a, b) => b.compatibility_score - a.compatibility_score);

    const topRecommendations = recommendedHooks.slice(0, limit);

    logger.info('Recommended hooks generated', {
      conceptType,
      count: topRecommendations.length,
      topScore: topRecommendations[0]?.compatibility_score,
    });

    return topRecommendations;
  } catch (error) {
    logger.error('Error getting recommended hooks', { error });
    throw error;
  }
}

/**
 * Get a specific hook by ID
 */
export async function getHookById(hookId: string): Promise<TrendingHook | null> {
  try {
    const { data, error } = await supabase
      .from('trending_hooks_library')
      .select('*')
      .eq('id', hookId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch hook', { hookId, error });
      throw error;
    }

    return data as TrendingHook | null;
  } catch (error) {
    logger.error('Error getting hook by ID', { error });
    throw error;
  }
}

/**
 * Fill a hook template with custom variables
 */
export function fillCustomHook(template: string, customVars: Partial<HookVariables>, defaultVars: HookVariables): string {
  const mergedVars = { ...defaultVars, ...customVars };
  return fillHookTemplate(template, mergedVars);
}

/**
 * Track hook performance
 */
export async function trackHookPerformance(
  hookId: string,
  variantId: string,
  metrics: {
    views?: number;
    engagementRate?: number;
    conversionRate?: number;
  }
): Promise<void> {
  logger.info('Tracking hook performance', { hookId, variantId, metrics });

  try {
    const { error } = await supabase.from('hook_performance').insert({
      hook_id: hookId,
      variant_id: variantId,
      views: metrics.views || 0,
      engagement_rate: metrics.engagementRate,
      conversion_rate: metrics.conversionRate,
    });

    if (error) {
      logger.error('Failed to track hook performance', { error });
      throw error;
    }
  } catch (error) {
    logger.error('Error tracking hook performance', { error });
    throw error;
  }
}

/**
 * Get hook performance statistics
 */
export async function getHookPerformanceStats(hookId: string) {
  try {
    const { data, error } = await supabase
      .from('hook_performance')
      .select('*')
      .eq('hook_id', hookId);

    if (error) {
      logger.error('Failed to fetch hook performance', { hookId, error });
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        totalUses: 0,
        avgEngagementRate: 0,
        avgConversionRate: 0,
        totalViews: 0,
      };
    }

    const totalUses = data.length;
    const totalViews = data.reduce((sum: number, record: any) => sum + (record.views || 0), 0);
    const avgEngagementRate =
      data.reduce((sum: number, record: any) => sum + (record.engagement_rate || 0), 0) / totalUses;
    const avgConversionRate =
      data.reduce((sum: number, record: any) => sum + (record.conversion_rate || 0), 0) / totalUses;

    return {
      totalUses,
      totalViews,
      avgEngagementRate,
      avgConversionRate,
    };
  } catch (error) {
    logger.error('Error getting hook performance stats', { error });
    throw error;
  }
}

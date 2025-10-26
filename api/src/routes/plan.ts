import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { Logger } from '../lib/logger';
import { validateAndNormalizePlan } from '../lib/preflight';
import {
  Plan,
  Beat,
  Overlay,
  VoiceOver,
  AssetRef,
  createDefaultConstraints,
} from '../../../packages/shared/src/plan';
import { getRecommendedHooks } from '../lib/hooks-service';
import { getProductAssets, getSelectedAssets } from '../lib/asset-analyzer';
import { buildConceptPrompts, extractHookVariables } from '../lib/veo3-prompt-builder';
import { compileManualPrompt, validateManualPrompt } from '../lib/manual-prompt-compiler';

const router = Router();
const logger = new Logger({ module: 'plan-route' });

/**
 * POST /api/plan
 * Generate and validate Plan JSON for concepts A/B/C
 */
router.post('/api/plan', async (req, res) => {
  try {
    const {
      projectId,
      userId,
      vertical,
      overrideHookA,
      overrideHookB,
      overrideHookC,
      creationMode,
      manualPrompt,
      brandTonePrompt,
      targetMarket,
    } = req.body;

    if (!projectId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['projectId', 'userId'],
      });
    }

    const hookOverrides = [overrideHookA, overrideHookB, overrideHookC];

    for (let i = 0; i < hookOverrides.length; i++) {
      const override = hookOverrides[i];
      if (override && typeof override === 'string') {
        const wordCount = override.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > 6) {
          return res.status(400).json({
            error: `Hook override for concept ${String.fromCharCode(65 + i)} exceeds 6 words`,
            provided: override,
            wordCount,
            maxWords: 6,
          });
        }
      }
    }

    logger.info('Generating plans for project', { projectId, userId, vertical, hasOverrides: hookOverrides.some(h => !!h) });

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, products(*), brand_kits(*)')
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (projectError || !project) {
      logger.error('Project not found', { projectId, error: projectError });
      return res.status(404).json({ error: 'Project not found' });
    }

    const product = project.products;
    const brandKit = project.brand_kits;

    if (!product || !brandKit) {
      return res.status(400).json({
        error: 'Project missing product or brand kit data',
      });
    }

    // Get selected assets
    const selectedAssets = await getSelectedAssets(product.id);

    if (selectedAssets.length < 3) {
      return res.status(400).json({
        error: 'At least 3 assets must be selected before generating plans',
        currentCount: selectedAssets.length,
      });
    }

    // Get or create variants for concepts A, B, C
    const { data: existingVariants, error: variantsError } = await supabase
      .from('variants')
      .select('*')
      .eq('project_id', projectId);

    if (variantsError) {
      logger.error('Failed to fetch variants', variantsError);
      return res.status(500).json({ error: 'Failed to fetch variants' });
    }

    const conceptTypes: Array<'pov' | 'question' | 'before_after'> = ['pov', 'question', 'before_after'];
    const conceptLabels = ['A', 'B', 'C'];
    const seeds = [341991, 911223, 557731];

    const plans: Plan[] = [];
    const variantUpdates: Array<{ variantId: string; plan: Plan }> = [];

    for (let i = 0; i < 3; i++) {
      const conceptType = conceptTypes[i];
      const conceptLabel = conceptLabels[i];
      const seed = seeds[i];

      logger.info('Generating plan for concept', {
        conceptType,
        conceptLabel,
        seed,
      });

      // Find or create variant
      let variant = existingVariants?.find((v) => v.concept_tag === conceptLabel);

      if (!variant) {
        const { data: newVariant, error: createError } = await supabase
          .from('variants')
          .insert({
            project_id: projectId,
            concept_tag: conceptLabel,
            seed,
            status: 'planned',
          })
          .select()
          .maybeSingle();

        if (createError || !newVariant) {
          logger.error('Failed to create variant', { conceptLabel, error: createError });
          continue;
        }

        variant = newVariant;
      }

      // Get recommended hooks for this concept type
      const recommendedHooks = await getRecommendedHooks(
        conceptType as any,
        {
          url: product.url,
          title: product.title,
          description: product.description,
          bullets: product.bullets || [],
          price: product.price,
          currency: product.currency || 'USD',
          images: product.images || [],
          brandName: product.brand_name,
          brandColors: product.brand_colors || [],
        },
        {
          brandName: brandKit.brand_name,
          logoSvg: brandKit.logo_svg,
          palette: brandKit.palette,
          style: brandKit.style,
        },
        1
      );

      const selectedHook = recommendedHooks[0];
      let hookText = selectedHook?.filled_text || `Check out ${product.title}`;

      const hookOverride = hookOverrides[i];
      if (hookOverride && typeof hookOverride === 'string') {
        hookText = hookOverride;
        logger.info('Applying hook override', { conceptLabel, override: hookOverride });
      }

      // Build plan
      const plan = await buildPlanForConcept(
        variant.id,
        conceptType,
        product,
        brandKit,
        selectedAssets,
        hookText,
        selectedHook?.id,
        seed,
        creationMode,
        manualPrompt,
        brandTonePrompt,
        targetMarket
      );

      // Validate and normalize
      const validation = await validateAndNormalizePlan(plan);

      if (!validation.valid) {
        logger.error('Plan validation failed', {
          conceptLabel,
          errors: validation.errors,
        });

        return res.status(400).json({
          error: 'Plan validation failed',
          concept: conceptLabel,
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }

      logger.info('Plan validated successfully', {
        conceptLabel,
        warnings: validation.warnings,
      });

      plans.push(validation.normalized!);
      variantUpdates.push({
        variantId: variant.id,
        plan: validation.normalized!,
      });
    }

    // Save plans to variants.script_json
    for (const update of variantUpdates) {
      const { error: updateError } = await supabase
        .from('variants')
        .update({
          script_json: update.plan,
          hook: update.plan.hookText,
          selected_hook_id: update.plan.hookId,
        })
        .eq('id', update.variantId);

      if (updateError) {
        logger.error('Failed to update variant with plan', {
          variantId: update.variantId,
          error: updateError,
        });
      }
    }

    logger.info('Plans generated and saved', {
      projectId,
      planCount: plans.length,
    });

    res.json({
      success: true,
      plans: plans.map((p) => ({
        id: p.id,
        variantId: p.variantId,
        conceptType: p.conceptType,
        hookText: p.hookText,
        beatCount: p.beats.length,
        totalDuration: p.targetDuration,
        isValidated: p.isValidated,
      })),
    });
  } catch (error) {
    logger.error('Plan generation error', { error });
    res.status(500).json({
      error: 'Failed to generate plans',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Build a complete Plan for a concept
 */
async function buildPlanForConcept(
  variantId: string,
  conceptType: 'pov' | 'question' | 'before_after',
  product: any,
  brandKit: any,
  selectedAssets: any[],
  hookText: string,
  hookId: string | undefined,
  seed: number,
  creationMode?: 'automated' | 'manual',
  manualPrompt?: string,
  brandTonePrompt?: string,
  targetMarket?: string
): Promise<Plan> {
  // If manual mode, compile enhanced prompt
  let enhancedPrompt;
  if (creationMode === 'manual' && manualPrompt) {
    enhancedPrompt = compileManualPrompt({
      userPrompt: manualPrompt,
      product: {
        url: product.url,
        title: product.title,
        description: product.description,
        bullets: product.bullets || [],
        price: product.price,
        currency: product.currency || 'USD',
        images: product.images || [],
        brandName: product.brand_name,
        brandColors: product.brand_colors || [],
      },
      brandName: brandKit.brand_name,
      brandColors: brandKit.palette ? Object.values(brandKit.palette) : [],
      brandTonePrompt: brandTonePrompt || brandKit.brand_tone_prompt,
      targetMarket: targetMarket || brandKit.target_market || 'Global',
    });

    logger.info('Manual prompt compiled', {
      variantId,
      userPrompt: manualPrompt.substring(0, 50),
      enhancedLength: enhancedPrompt.fullPrompt.length,
    });
  }
  const planId = uuidv4();

  // Map selected assets to AssetRef format
  const assetRefs: AssetRef[] = selectedAssets.map((asset) => ({
    id: asset.id,
    url: asset.asset_url,
    type: asset.asset_type,
    width: asset.width,
    height: asset.height,
  }));

  // Build beats
  const beats: Beat[] = buildBeatsForConcept(
    conceptType,
    product,
    brandKit,
    assetRefs,
    hookText,
    seed,
    enhancedPrompt
  );

  // Build plan
  const plan: Plan = {
    id: planId,
    variantId,
    conceptType,
    aspectRatio: '9:16',
    targetDuration: 24,
    format: 'mp4',
    resolution: '1080p',
    fps: 30,
    beats,
    brand: {
      name: brandKit.brand_name,
      primaryColor: brandKit.palette.primary,
      secondaryColor: brandKit.palette.secondary,
      accentColor: brandKit.palette.accent,
      logoUrl: undefined, // TODO: Generate PNG from SVG
      style: brandKit.style,
    },
    selectedAssets: assetRefs,
    constraints: createDefaultConstraints(),
    hookId,
    hookText,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isValidated: false,
    validationErrors: [],
  };

  return plan;
}

/**
 * Build beats for a specific concept type
 */
function buildBeatsForConcept(
  conceptType: string,
  product: any,
  brandKit: any,
  assetRefs: AssetRef[],
  hookText: string,
  seed: number,
  enhancedPrompt?: any
): Beat[] {
  const beats: Beat[] = [];
  const beatDuration = 6;

  // Beat 1: Hook
  const hookPrompt = enhancedPrompt
    ? `${enhancedPrompt.fullPrompt}\n\nFocus on hook/opening scene (0-6 seconds).`
    : `Create a vertical 9:16 video opening. ${hookText}. Show ${product.title} prominently. Use ${brandKit.palette.primary} as brand color. ${getVisualStyle(conceptType, 'hook')}. High energy, attention-grabbing.`;

  beats.push({
    id: uuidv4(),
    type: 'hook',
    order: 0,
    startTime: 0,
    endTime: 6,
    duration: beatDuration,
    assetRefs: [assetRefs[0]],
    visualStyle: enhancedPrompt ? enhancedPrompt.visualStyle : getVisualStyle(conceptType, 'hook'),
    cameraMovement: 'dynamic',
    overlays: [
      {
        text: truncateToWords(hookText, 6),
        startTime: 0.5,
        endTime: 5.5,
        position: 'top',
        fontSize: 'xlarge',
        style: 'bold',
        color: '#FFFFFF',
        animation: 'fade',
      },
    ],
    prompt: hookPrompt,
    seed,
    musicVolume: 0.3,
  });

  // Beat 2: Demo
  const feature1 = product.bullets?.[0] || 'Premium quality and design';
  const demoPrompt = enhancedPrompt
    ? `${enhancedPrompt.fullPrompt}\n\nFocus on demonstration/product showcase (6-12 seconds). ${enhancedPrompt.shotSequence}`
    : `Continue from previous scene. Showcase ${feature1}. Show ${product.title} in action. Maintain ${brandKit.palette.primary} brand color. ${getVisualStyle(conceptType, 'demo')}.`;

  beats.push({
    id: uuidv4(),
    type: 'demo',
    order: 1,
    startTime: 6,
    endTime: 12,
    duration: beatDuration,
    assetRefs: [assetRefs[1] || assetRefs[0]],
    visualStyle: enhancedPrompt ? enhancedPrompt.visualStyle : getVisualStyle(conceptType, 'demo'),
    cameraMovement: 'pan',
    voiceOver: {
      text: feature1.substring(0, 100),
      startTime: 6,
      endTime: 12,
      voice: 'professional',
      speed: 1.0,
      pitch: 1.0,
    },
    overlays: [
      {
        text: truncateToWords(feature1, 5),
        startTime: 6.5,
        endTime: 11.5,
        position: 'center',
        fontSize: 'large',
        style: 'bold',
        color: '#FFFFFF',
        animation: 'slide_up',
      },
    ],
    prompt: demoPrompt,
    seed: seed + 1,
    musicVolume: 0.3,
  });

  // Beat 3: Proof
  const feature2 = product.bullets?.[1] || 'Outstanding results you can see';
  const proofPrompt = enhancedPrompt
    ? `${enhancedPrompt.fullPrompt}\n\nFocus on emotional response/lifestyle context (12-18 seconds). ${enhancedPrompt.characterConsistency}`
    : `Build on previous scene. Show ${feature2}. ${product.title} in aspirational lifestyle context. ${getVisualStyle(conceptType, 'proof')}.`;

  beats.push({
    id: uuidv4(),
    type: 'proof',
    order: 2,
    startTime: 12,
    endTime: 18,
    duration: beatDuration,
    assetRefs: [assetRefs[2] || assetRefs[1] || assetRefs[0]],
    visualStyle: enhancedPrompt ? enhancedPrompt.visualStyle : getVisualStyle(conceptType, 'proof'),
    cameraMovement: 'zoom',
    voiceOver: {
      text: feature2.substring(0, 100),
      startTime: 12,
      endTime: 18,
      voice: 'professional',
      speed: 1.0,
      pitch: 1.0,
    },
    overlays: [
      {
        text: truncateToWords(feature2, 5),
        startTime: 12.5,
        endTime: 17.5,
        position: 'bottom',
        fontSize: 'large',
        style: 'bold',
        color: '#FFFFFF',
        animation: 'fade',
      },
    ],
    prompt: proofPrompt,
    seed: seed + 2,
    musicVolume: 0.3,
  });

  // Beat 4: CTA
  const ctaPrompt = enhancedPrompt
    ? `${enhancedPrompt.fullPrompt}\n\nFocus on product hero shot with call-to-action (18-24 seconds). ${enhancedPrompt.productSpecificity}`
    : `Final scene. ${product.title} hero shot. Clean composition with space for CTA text. Brand colors ${brandKit.palette.primary}. Confident, complete feeling.`;

  beats.push({
    id: uuidv4(),
    type: 'cta',
    order: 3,
    startTime: 18,
    endTime: 24,
    duration: beatDuration,
    assetRefs: [assetRefs[3] || assetRefs[2] || assetRefs[0]],
    visualStyle: enhancedPrompt ? enhancedPrompt.visualStyle : getVisualStyle(conceptType, 'cta'),
    cameraMovement: 'static',
    overlays: [
      {
        text: 'Get Yours Now',
        startTime: 18.5,
        endTime: 23.5,
        position: 'bottom',
        fontSize: 'xlarge',
        style: 'bold',
        color: '#FFFFFF',
        backgroundColor: brandKit.palette.primary,
        animation: 'zoom',
      },
    ],
    prompt: ctaPrompt,
    seed: seed + 3,
    musicVolume: 0.3,
  });

  return beats;
}

/**
 * Get visual style for concept type and beat
 */
function getVisualStyle(conceptType: string, beatType: string): string {
  const styles: Record<string, Record<string, string>> = {
    pov: {
      hook: 'Authentic UGC style, handheld camera feel, relatable',
      demo: 'Natural lighting, casual product showcase, conversational',
      proof: 'Personal transformation vibe, aspirational',
      cta: 'Direct and honest, authentic recommendation',
    },
    question: {
      hook: 'Curiosity-driven, educational tone, modern',
      demo: 'Clear product showcase, explainer style, professional',
      proof: 'Data-backed, credible, informative',
      cta: 'Confident answer, solution-focused',
    },
    before_after: {
      hook: 'Dramatic setup, problem-focused, relatable pain',
      demo: 'Transformation in progress, dynamic change',
      proof: 'Aspirational result, lifestyle upgrade',
      cta: 'Empowering, transformation complete',
    },
  };

  return styles[conceptType]?.[beatType] || 'Professional, engaging, high-quality';
}

/**
 * Truncate text to word limit
 */
function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

export default router;

import { Router } from 'express';
import { Logger } from '../lib/logger';
import { supabase } from '../lib/supabase';

const router = Router();
const logger = new Logger({ module: 'duplicate-routes' });

router.post('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, changes } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId',
      });
    }

    logger.info('Duplicate project request received', {
      projectId,
      userId,
      hasChanges: !!changes,
    });

    const { data: originalProject, error: fetchError } = await supabase
      .from('projects')
      .select('*, products(*), brand_kits(*)')
      .eq('id', projectId)
      .maybeSingle();

    if (fetchError || !originalProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    if (originalProject.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to duplicate this project',
      });
    }

    const newProjectData: any = {
      user_id: userId,
      source_url: originalProject.source_url,
      source_type: originalProject.source_type,
      status: 'pending',
      metadata: {
        ...originalProject.metadata,
        duplicatedFrom: projectId,
        duplicatedAt: new Date().toISOString(),
        changes: changes || {},
      },
    };

    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert(newProjectData)
      .select('id')
      .single();

    if (createError || !newProject) {
      throw new Error(`Failed to create duplicate project: ${createError?.message}`);
    }

    logger.info('Duplicate project created', {
      originalProjectId: projectId,
      newProjectId: newProject.id,
    });

    if (originalProject.products && originalProject.products.length > 0) {
      const product = originalProject.products[0];
      const newProductData: any = {
        project_id: newProject.id,
        title: product.title,
        url: product.url,
        price: product.price,
        currency: product.currency,
        bullets: product.bullets,
        description: product.description,
        category: product.category,
        metadata: product.metadata,
      };

      if (changes?.productChanges) {
        Object.assign(newProductData, changes.productChanges);
      }

      const { error: productError } = await supabase
        .from('products')
        .insert(newProductData);

      if (productError) {
        logger.error('Failed to duplicate product', { error: productError });
      }

      if (changes?.selectedAssetIds && Array.isArray(changes.selectedAssetIds)) {
        for (const assetId of changes.selectedAssetIds) {
          await supabase
            .from('selected_assets')
            .insert({
              project_id: newProject.id,
              asset_id: assetId,
            });
        }
      } else {
        const { data: originalAssets } = await supabase
          .from('selected_assets')
          .select('asset_id')
          .eq('project_id', projectId);

        if (originalAssets) {
          for (const asset of originalAssets) {
            await supabase
              .from('selected_assets')
              .insert({
                project_id: newProject.id,
                asset_id: asset.asset_id,
              });
          }
        }
      }
    }

    if (originalProject.brand_kits && originalProject.brand_kits.length > 0) {
      const brandKit = originalProject.brand_kits[0];
      const newBrandKitData: any = {
        project_id: newProject.id,
        brand_name: brandKit.brand_name,
        primary_color: brandKit.primary_color,
        secondary_color: brandKit.secondary_color,
        logo_url: brandKit.logo_url,
        brand_style: brandKit.brand_style,
        target_market: brandKit.target_market,
        brand_tone: brandKit.brand_tone,
      };

      if (changes?.brandKitChanges) {
        Object.assign(newBrandKitData, changes.brandKitChanges);
      }

      const { error: brandKitError } = await supabase
        .from('brand_kits')
        .insert(newBrandKitData);

      if (brandKitError) {
        logger.error('Failed to duplicate brand kit', { error: brandKitError });
      }
    }

    const { data: originalVariants } = await supabase
      .from('variants')
      .select('*')
      .eq('project_id', projectId);

    if (originalVariants && changes?.duplicateVariants !== false) {
      for (const variant of originalVariants) {
        const newVariantData: any = {
          project_id: newProject.id,
          concept_tag: variant.concept_tag,
          status: 'pending',
          seed: changes?.useNewSeeds ? variant.seed + 1000 : variant.seed,
          hook: variant.hook,
          script_json: variant.script_json,
        };

        if (changes?.variantChanges && changes.variantChanges[variant.concept_tag]) {
          Object.assign(newVariantData, changes.variantChanges[variant.concept_tag]);
        }

        await supabase
          .from('variants')
          .insert(newVariantData);
      }
    }

    logger.info('Duplicate project complete', {
      originalProjectId: projectId,
      newProjectId: newProject.id,
      userId,
    });

    res.json({
      success: true,
      projectId: newProject.id,
      originalProjectId: projectId,
      message: 'Project duplicated successfully',
    });
  } catch (error) {
    logger.error('Failed to duplicate project', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Duplication failed',
    });
  }
});

router.post('/:projectId/variant/:variantId', async (req, res) => {
  try {
    const { projectId, variantId } = req.params;
    const { userId, changes } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId',
      });
    }

    logger.info('Duplicate variant request received', {
      projectId,
      variantId,
      userId,
    });

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError || !project || project.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { data: originalVariant, error: variantError } = await supabase
      .from('variants')
      .select('*')
      .eq('id', variantId)
      .maybeSingle();

    if (variantError || !originalVariant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
      });
    }

    const newVariantData: any = {
      project_id: projectId,
      concept_tag: changes?.conceptTag || originalVariant.concept_tag,
      status: 'pending',
      seed: changes?.seed || originalVariant.seed + 100,
      hook: changes?.hook || originalVariant.hook,
      script_json: changes?.scriptJson || originalVariant.script_json,
    };

    const { data: newVariant, error: createError } = await supabase
      .from('variants')
      .insert(newVariantData)
      .select('*')
      .single();

    if (createError || !newVariant) {
      throw new Error(`Failed to duplicate variant: ${createError?.message}`);
    }

    logger.info('Duplicate variant created', {
      originalVariantId: variantId,
      newVariantId: newVariant.id,
    });

    res.json({
      success: true,
      variant: newVariant,
      message: 'Variant duplicated successfully',
    });
  } catch (error) {
    logger.error('Failed to duplicate variant', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Variant duplication failed',
    });
  }
});

export default router;

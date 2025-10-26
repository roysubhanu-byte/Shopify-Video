import { Router } from 'express';
import { Logger } from '../lib/logger';
import {
  getFrameworksForProduct,
  getRecommendedFrameworks,
  detectProductCategory,
  STORYTELLING_FRAMEWORKS,
} from '../lib/storytelling-frameworks';

const router = Router();
const logger = new Logger({ module: 'frameworks-route' });

/**
 * GET /api/frameworks
 * Get all available storytelling frameworks
 */
router.get('/api/frameworks', async (req, res) => {
  try {
    const frameworks = Object.values(STORYTELLING_FRAMEWORKS).map(fw => ({
      id: fw.id,
      name: fw.name,
      description: fw.description,
      bestFor: fw.bestFor,
      examplePrompt: fw.examplePrompt,
      emotionalArc: fw.emotionalArc,
    }));

    res.json({ frameworks });
  } catch (error) {
    logger.error('Error fetching frameworks', { error });
    res.status(500).json({
      error: 'Failed to fetch frameworks',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/frameworks/recommend
 * Get recommended frameworks for a product
 */
router.post('/api/frameworks/recommend', async (req, res) => {
  try {
    const { productData } = req.body;

    if (!productData || !productData.title) {
      return res.status(400).json({
        error: 'Missing required field: productData',
      });
    }

    const category = detectProductCategory(productData);
    const recommendedIds = getRecommendedFrameworks(category);
    const allFrameworks = getFrameworksForProduct(productData);

    logger.info('Recommended frameworks', {
      category,
      recommendedCount: recommendedIds.length,
      productTitle: productData.title,
    });

    res.json({
      category,
      frameworks: allFrameworks.map(fw => ({
        id: fw.id,
        name: fw.name,
        description: fw.description,
        bestFor: fw.bestFor,
        examplePrompt: fw.examplePrompt,
        emotionalArc: fw.emotionalArc,
        recommended: fw.recommended,
      })),
    });
  } catch (error) {
    logger.error('Error recommending frameworks', { error });
    res.status(500).json({
      error: 'Failed to recommend frameworks',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

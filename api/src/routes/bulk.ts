import { Router } from 'express';
import { Logger } from '../lib/logger';
import { bulkImportService } from '../lib/bulk-import-service';

const router = Router();
const logger = new Logger({ module: 'bulk-routes' });

router.post('/csv', async (req, res) => {
  try {
    const { csvContent, userId, skipHeader, delimiter } = req.body;

    if (!csvContent || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: csvContent, userId',
      });
    }

    logger.info('CSV import request received', {
      userId,
      contentLength: csvContent.length,
    });

    const result = await bulkImportService.importFromCsv(csvContent, userId, {
      skipHeader,
      delimiter,
    });

    res.json(result);
  } catch (error) {
    logger.error('CSV import failed', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'CSV import failed',
    });
  }
});

router.post('/shopify', async (req, res) => {
  try {
    const { shopifyStoreUrl, accessToken, userId, productIds, limit } = req.body;

    if (!shopifyStoreUrl || !accessToken || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: shopifyStoreUrl, accessToken, userId',
      });
    }

    logger.info('Shopify import request received', {
      userId,
      shopifyStoreUrl,
      limit,
    });

    const result = await bulkImportService.importFromShopify(
      shopifyStoreUrl,
      accessToken,
      userId,
      { productIds, limit }
    );

    res.json(result);
  } catch (error) {
    logger.error('Shopify import failed', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Shopify import failed',
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    const { projectIds } = req.query;

    if (!projectIds) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: projectIds',
      });
    }

    const ids = Array.isArray(projectIds)
      ? projectIds as string[]
      : (projectIds as string).split(',');

    const status = await bulkImportService.getBulkImportStatus(ids);

    res.json({
      success: true,
      projects: status,
    });
  } catch (error) {
    logger.error('Failed to fetch bulk import status', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status fetch failed',
    });
  }
});

export default router;

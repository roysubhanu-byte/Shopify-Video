import { Router } from 'express';
import { getErrorStats } from '../lib/logger';

const router = Router();

router.get('/healthz', (req, res) => {
  const stats = getErrorStats();
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    features: {
      urlIngest: 'enabled',
      autoBrandKit: 'enabled',
      threeConcepts: 'enabled',
      trendHooks: 'enabled',
      customPrompts: 'enabled',
    },
    errorRate: (stats.errorRate * 100).toFixed(2) + '%',
    errors: stats.errors,
    total: stats.total,
  });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;

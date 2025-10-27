// api/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { logger, requestLogger } from './lib/logger';

import ingestRouter from './routes/ingest';
import healthRouter from './routes/health';
import planRouter from './routes/plan';
import renderRouter from './routes/render';
import webhooksRouter from './routes/webhooks';
import productsRouter from './routes/products';
import hooksRouter from './routes/hooks';
import staticRouter from './routes/static';
import frameworksRouter from './routes/frameworks';
import beatsRouter from './routes/beats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

/**
 * Build the allowlist:
 * - APP_ORIGINS (comma-separated) or APP_URL
 * - Any *.vercel.app (preview/prod)
 * - Local dev ports (Vite)
 */
const configured = (process.env.APP_ORIGINS || process.env.APP_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins: (string | RegExp)[] = [
  ...configured,
  /^https:\/\/.*\.vercel\.app$/,
  'http://localhost:5173',
  'http://localhost:4173',
];

/**
 * Health endpoint needs permissive CORS so
 * the frontend can always verify API status.
 * We attach headers first, then hand off to the router.
 */
app.get('/healthz', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  return next();
});

/** Global CORS for the rest of the API */
app.use(
  cors({
    origin: (origin, cb) => {
      // Non-browser / server-to-server calls
      if (!origin) return cb(null, true);

      const ok = allowedOrigins.some((allowed) =>
        typeof allowed === 'string' ? origin === allowed : allowed.test(origin)
      );

      if (ok) return cb(null, true);

      logger.warn('CORS blocked origin', {
        origin,
        allowedOrigins: allowedOrigins.map(o => o.toString()),
      });
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

/** Respond to all preflight requests */
app.options('*', cors());

app.use(express.json());
app.use(requestLogger);

/** Routes */
app.use(healthRouter);
app.use(ingestRouter);
app.use(planRouter);
app.use(renderRouter);
app.use(webhooksRouter);
app.use(productsRouter);
app.use(hooksRouter);
app.use(staticRouter);
app.use(frameworksRouter);
app.use(beatsRouter);

/** Error handler */
app.use(
  (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Server error', err, { endpoint: req.path, method: req.method });
    res.status(500).json({ error: 'Internal server error' });
  }
);

async function start() {
  logger.info('Starting API server', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins: allowedOrigins.map(o => o.toString()),
  });

  app.listen(PORT, () => {
    logger.info('API server started', {
      port: PORT,
      endpoints: [
        'GET  /healthz                  - Health check',
        'POST /api/ingest/url           - Paste URL → get 3 concepts',
        'GET  /api/ingest/products      - List user products',
        'GET  /api/products             - Get products from Shopify or generic site',
        'GET  /api/hooks                - Get trending hook templates',
        'POST /api/plan                 - Generate validated plans (with hook overrides)',
        'POST /api/render/previews      - Queue preview renders',
        'POST /api/render/finals        - Queue final renders',
        'POST /api/render/swap-hook     - Generate preview with new hook',
        'POST /api/render/static        - Generate static PNG images',
        'GET  /static/*                 - Serve static files',
        'POST /webhooks/veo             - VEO3 callback handler',
      ],
    });

    // Friendly console output for local dev
    console.log(`\n🚀 API ready on http://localhost:${PORT}`);
    console.log(`\n🔒 CORS allows:`);
    allowedOrigins.forEach(o => console.log(`   • ${o.toString()}`));
  });
}

start().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});

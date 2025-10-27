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

const allowedOrigins = [
  process.env.APP_URL,
  /^https:\/\/.*\.vercel\.app$/,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin, allowedOrigins: allowedOrigins.map(o => o.toString()) });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(requestLogger);

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

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error', err, { endpoint: req.path, method: req.method });
  res.status(500).json({ error: 'Internal server error' });
});

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

    console.log(`\n🚀 API ready on http://localhost:${PORT}`);
    console.log(`\n📌 KEY FEATURES:`);
    console.log(`   ✅ URL Ingest - Paste any product URL`);
    console.log(`   ✅ Auto Brand Kit - SVG logos + palettes`);
    console.log(`   ✅ 3 Concepts - POV, Question, Before/After (fixed seeds)`);
    console.log(`   ✅ Trend Hooks - Pattern templates`);
    console.log(`\n🔒 SECURITY:`);
    console.log(`   ✅ CORS allows:`);
    allowedOrigins.forEach(o => console.log(`      - ${o.toString()}`));
    console.log(`   ✅ Structured logging + error monitoring`);
  });
}

start().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});

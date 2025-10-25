import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger, requestLogger } from './lib/logger';
import ingestRouter from './routes/ingest';
import healthRouter from './routes/health';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

const allowedOrigin = process.env.APP_URL || 'http://localhost:5173';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === allowedOrigin) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin, allowed: allowedOrigin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(requestLogger);

app.use(healthRouter);
app.use(ingestRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error', err, { endpoint: req.path, method: req.method });
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  logger.info('Starting API server', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
    appUrl: allowedOrigin,
  });

  app.listen(PORT, () => {
    logger.info('API server started', {
      port: PORT,
      endpoints: [
        'GET  /healthz                  - Health check',
        'POST /api/ingest/url           - Paste URL → get 3 concepts',
        'GET  /api/ingest/products      - List user products',
      ],
    });

    console.log(`\n🚀 API ready on http://localhost:${PORT}`);
    console.log(`\n📌 KEY FEATURES:`);
    console.log(`   ✅ URL Ingest - Paste any product URL`);
    console.log(`   ✅ Auto Brand Kit - SVG logos + palettes`);
    console.log(`   ✅ 3 Concepts - POV, Question, Before/After (fixed seeds)`);
    console.log(`   ✅ Trend Hooks - Pattern templates`);
    console.log(`\n🔒 SECURITY:`);
    console.log(`   ✅ CORS locked to: ${allowedOrigin}`);
    console.log(`   ✅ Structured logging + error monitoring`);
  });
}

start().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});

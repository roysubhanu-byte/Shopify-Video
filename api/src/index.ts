// api/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { logger, requestLogger } from './lib/logger';
import healthHandler from './routes/health';

// Routers (each router already prefixes its own path, e.g. router.get('/api/products', ...))
import ingestRouter from './routes/ingest';
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

const PORT = Number(process.env.PORT || 8787);

/**
 * Build CORS allowlist
 * - APP_ORIGINS: comma separated origins
 * - APP_URL: your deployed frontend URL
 * - Dev ports (Vite): 5173/4173
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

app.use(cors({
  origin(origin, cb) {
    // allow same-origin / curl / SSR
    if (!origin) return cb(null, true);
    const ok = allowedOrigins.some(rule =>
      rule instanceof RegExp ? rule.test(origin) : rule === origin
    );
    cb(ok ? null : new Error(`CORS blocked for ${origin}`), ok);
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(requestLogger);

/** Health first (cheap) */
app.get('/api/health', healthHandler);

/** API routes */
app.use(ingestRouter);
app.use(planRouter);
app.use(renderRouter);
app.use(webhooksRouter);
app.use(productsRouter);
app.use(hooksRouter);
app.use(staticRouter);
app.use(frameworksRouter);
app.use(beatsRouter);

/** 404 for unknown API routes */
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found', path: req.path });
  }
  next();
});

/** Error handler */
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('API error', { err: err?.message || err, stack: err?.stack });
  const code = typeof err?.status === 'number' ? err.status : 500;
  res.status(code).json({ error: err?.message || 'Server error' });
});

/** Start server ONLY after routes are mounted */
app.listen(PORT, () => {
  console.log(`[api] listening on ${PORT}`);
});

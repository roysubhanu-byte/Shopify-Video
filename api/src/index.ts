// api/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// middleware & helpers
import { requestLogger } from './lib/logger';

// route modules
import ingestRouter from './routes/ingest';
import planRouter from './routes/plan';
import renderRouter from './routes/render';
import webhooksRouter from './routes/webhooks';
import productsRouter from './routes/products';
import hooksRouter from './routes/hooks';
import staticRouter from './routes/static';
import frameworksRouter from './routes/frameworks';
import beatsRouter from './routes/beats';

// health endpoint
import { healthHandler } from './routes/health';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8787);

/**
 * CORS allow-list
 *
 * You can pass APP_ORIGINS as a comma-separated list in Render env,
 * and/or APP_URL for your deployed frontend.
 */
const configured =
  (process.env.APP_ORIGINS || process.env.APP_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const allowedOrigins: (string | RegExp)[] = [
  ...configured,
  // any Vercel preview/prod
  /^https:\/\/.+\.vercel\.app$/,
  // Render.com origins (your backend)
  /^https:\/\/.+\.onrender\.com$/,
  // local dev ports (Vite/SSR)
  'http://localhost:5173',
  'http://localhost:4173',
  // WebContainer (StackBlitz, bolt.new) origins - including malformed URLs
  /^https:\/\/[^/]+\.local-credentialless\.webcontainer-api\.io$/,
  /^https:\/\/[^/]+\.local-credentialless\.webcontainer\.api\.io$/,
  /^https:\/\/[^/]+\.webcontainer\.io$/,
  /^https:\/\/[^/]+\.webcontainer-api\.io$/,
];

app.use(
  cors({
    origin(origin, cb) {
      // no origin on curl/SSR — allow
      if (!origin) return cb(null, true);

      const ok =
        allowedOrigins.some((rule) =>
          rule instanceof RegExp ? rule.test(origin) : rule === origin
        ) || false;

      return ok ? cb(null, true) : cb(new Error(`CORS blocked for ${origin}`));
    },
    credentials: true,
  })
);

// Body parsing & logging
app.use(express.json({ limit: '5mb' }));
app.use(requestLogger);

// Health endpoints (register ONCE)
app.get('/api/health', healthHandler);
app.get('/healthz', healthHandler); // alias for old frontends/tools

/** Mount API routers (each router defines its own /api/... paths) */
app.use(ingestRouter);
app.use(planRouter);
app.use(renderRouter);
app.use(webhooksRouter);
app.use(productsRouter);
app.use(hooksRouter);
app.use(staticRouter);
app.use(frameworksRouter);
app.use(beatsRouter);

// Fallback for unknown routes – keeps your /api/... tests readable
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Start server
app.listen(PORT, () => {
  // small log Render will capture
  // eslint-disable-next-line no-console
  console.log(`[api] listening on :${PORT}`);
});

export default app;

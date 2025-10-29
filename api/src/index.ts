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

// Log startup configuration (without exposing secrets)
const startupInfo = {
  port: process.env.PORT || 8787,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'not set',
  appUrl: process.env.APP_URL || 'not set',
  hasGoogleKey: !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_VEO3_API_KEY),
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
};

console.log('[Startup] Configuration loaded:', startupInfo);

if (!startupInfo.hasGoogleKey) {
  console.warn('[Startup] WARNING: No Google API key found in environment variables');
  console.warn('[Startup] Set GOOGLE_API_KEY or GEMINI_API_KEY to enable video generation');
}

if (!startupInfo.hasSupabaseUrl || !startupInfo.hasSupabaseKey) {
  console.warn('[Startup] WARNING: Supabase configuration incomplete');
}

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
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  // WebContainer (StackBlitz, bolt.new) origins - including malformed URLs
  /^https:\/\/[^/]+\.local-credentialless\.webcontainer-api\.io$/,
  /^https:\/\/[^/]+\.local-credentialless\.webcontainer\.api\.io$/,
  /^https:\/\/[^/]+\.local\.webcontainer-api\.io$/,
  /^https:\/\/[^/]+\.webcontainer\.io$/,
  /^https:\/\/[^/]+\.webcontainer-api\.io$/,
  /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.local-credentialless\.webcontainer-api\.io$/,
  /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.local\.webcontainer-api\.io$/,
];

console.log('[CORS] Configured allowed origins:', {
  configured: configured.length > 0 ? configured : 'none',
  patterns: allowedOrigins.length,
});

app.use(
  cors({
    origin(origin, cb) {
      // no origin on curl/SSR — allow
      if (!origin) {
        console.log('[CORS] Request without origin (likely server-side) - allowing');
        return cb(null, true);
      }

      const ok =
        allowedOrigins.some((rule) =>
          rule instanceof RegExp ? rule.test(origin) : rule === origin
        ) || false;

      if (ok) {
        console.log('[CORS] Origin allowed:', origin);
        return cb(null, true);
      } else {
        console.error('[CORS] Origin BLOCKED:', origin);
        console.error('[CORS] Allowed origins:', allowedOrigins);
        return cb(new Error(`CORS policy blocked request from origin: ${origin}`));
      }
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

// Global error handler for CORS and other errors
app.use((err: any, req: any, res: any, next: any) => {
  if (err.message && err.message.includes('CORS')) {
    console.error('[CORS Error]', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      error: err.message,
    });
    return res.status(403).json({
      error: 'CORS policy error',
      message: err.message,
      origin: req.headers.origin,
      supportedOrigins: 'Vercel, Render, WebContainer, and localhost',
    });
  }

  console.error('[Server Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Fallback for unknown routes
app.use((req, res) => {
  console.log('[404] Route not found:', req.method, req.path);
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Start server
app.listen(PORT, () => {
  console.log(`[api] Server started successfully`);
  console.log(`[api] Listening on port: ${PORT}`);
  console.log(`[api] Environment:`, {
    NODE_ENV: process.env.NODE_ENV || 'development',
    APP_URL: process.env.APP_URL || 'not set',
    hasGoogleKey: !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY),
    hasSupabase: !!process.env.SUPABASE_URL,
  });
});

export default app;

// api/src/routes/health.ts
import type { Request, Response } from 'express';
import { validateGoogleApiKey, getGoogleKeySource } from '../lib/google';
import { supabase } from '../lib/supabase';

type Check = { name: string; ok: boolean; info?: string };

function has(v?: string) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * We now treat Google as OPTIONAL.
 * We accept any of these env names for the same Gemini/Veo key.
 */
function googleKey(): string | undefined {
  return (
    process.env.GOOGLE_VEO3_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY
  );
}

export async function healthHandler(_req: Request, res: Response) {
  const startTime = Date.now();
  const checks: Check[] = [];

  // Required
  checks.push({ name: 'NODE_ENV', ok: has(process.env.NODE_ENV), info: process.env.NODE_ENV });
  checks.push({ name: 'APP_URL', ok: has(process.env.APP_URL) });
  checks.push({ name: 'SUPABASE_URL', ok: has(process.env.SUPABASE_URL) });
  checks.push({ name: 'SUPABASE_ANON_KEY', ok: has(process.env.SUPABASE_ANON_KEY) });
  checks.push({ name: 'OPENAI_API_KEY', ok: has(process.env.OPENAI_API_KEY) });

  // Optional providers (only block features that depend on them)
  checks.push({ name: 'GOOGLE_VEO3_API_KEY', ok: has(process.env.GOOGLE_VEO3_API_KEY) });
  checks.push({ name: 'GOOGLE_API_KEY', ok: has(process.env.GOOGLE_API_KEY) });
  checks.push({ name: 'GEMINI_API_KEY', ok: has(process.env.GEMINI_API_KEY) });
  checks.push({ name: 'ELEVENLABS_API_KEY', ok: has(process.env.ELEVENLABS_API_KEY) });

  // Validate Google API key if present
  const googleValidation = validateGoogleApiKey();
  const googleSource = getGoogleKeySource();

  // Test Supabase connection
  let supabaseConnected = false;
  let supabaseError = null;
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    supabaseConnected = !error;
    supabaseError = error?.message;
  } catch (err) {
    supabaseError = err instanceof Error ? err.message : 'Connection failed';
  }

  // Overall ok = all required are true
  const requiredOk = checks
    .filter((c) => ['APP_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENAI_API_KEY', 'NODE_ENV'].includes(c.name))
    .every((c) => c.ok);

  const responseTime = Date.now() - startTime;

  res.json({
    ok: requiredOk,
    status: requiredOk ? (supabaseConnected && googleValidation.valid ? 'healthy' : 'degraded') : 'error',
    time: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    uptime: Math.floor(process.uptime()),
    services: {
      api: 'ok',
      supabase: {
        connected: supabaseConnected,
        error: supabaseError,
      },
      google: {
        configured: googleValidation.valid,
        source: googleSource,
        error: googleValidation.error,
      },
    },
    flags: {
      openai: has(process.env.OPENAI_API_KEY),
      google: googleValidation.valid,
      tts: has(process.env.ELEVENLABS_API_KEY),
    },
    checks,
  });
}

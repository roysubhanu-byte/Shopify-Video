import type { Request, Response } from 'express';
import fetch from 'node-fetch';

type Check = { name: string; ok: boolean; info?: any; error?: string };

async function checkSupabase(): Promise<Check> {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { name: 'supabase', ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' };
    }
    // lightweight ping: list tables (metadata) via PostgREST; adjust path if locked down
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/?select=1`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    const ok = r.ok; // 200 in permissive projects; if 401, at least host resolves
    return { name: 'supabase', ok, info: { status: r.status } };
  } catch (e: any) {
    return { name: 'supabase', ok: false, error: e?.message || 'Supabase fetch failed' };
  }
}

async function checkVeo3(): Promise<Check> {
  // If you’re using another provider, change this block accordingly.
  const key = process.env.GOOGLE_VEO3_API_KEY || process.env.VEO3_API_KEY;
  if (!key) return { name: 'veo3', ok: false, error: 'Missing GOOGLE_VEO3_API_KEY' };

  try {
    // Many providers allow a capabilities or models list call without billing & without consuming credits.
    // This endpoint is illustrative; replace with your real model list or whoami endpoint.
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': key },
    });
    // Even a 401 proves we reached the service and the key is recognized/checked.
    return { name: 'veo3', ok: r.ok, info: { status: r.status } };
  } catch (e: any) {
    return { name: 'veo3', ok: false, error: e?.message || 'Veo3 ping failed' };
  }
}

async function checkQueue(): Promise<Check> {
  // If you use a queue (Bull, Redis, etc.)—do a quick ping. Otherwise return ok.
  try {
    if (!process.env.REDIS_URL) return { name: 'queue', ok: true, info: 'no-redis-configured' };
    const { createClient } = await import('redis');
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    const pong = await client.ping();
    await client.disconnect();
    return { name: 'queue', ok: pong === 'PONG', info: { pong } };
  } catch (e: any) {
    return { name: 'queue', ok: false, error: e?.message || 'Queue ping failed' };
  }
}

export async function healthHandler(_req: Request, res: Response) {
  const checks = await Promise.all([checkSupabase(), checkVeo3(), checkQueue()]);
  const ok = checks.every(c => c.ok);
  res.status(ok ? 200 : 503).json({
    ok,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      has_SUPABASE_URL: !!process.env.SUPABASE_URL,
      has_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      has_GoogleVeo3Key: !!(process.env.GOOGLE_VEO3_API_KEY || process.env.VEO3_API_KEY),
      has_REDIS_URL: !!process.env.REDIS_URL,
    },
    checks,
  });
}

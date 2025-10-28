// api/src/routes/health.ts
import type { Request, Response } from 'express';

type Check = { name: string; ok: boolean; info?: string };

function present(x?: string): boolean {
  return !!x && x.trim().length > 0;
}

export function healthHandler(_req: Request, res: Response) {
  const checks: Check[] = [
    { name: 'NODE_ENV', ok: present(process.env.NODE_ENV), info: process.env.NODE_ENV || 'unset' },
    { name: 'APP_URL', ok: present(process.env.APP_URL) },
    { name: 'SUPABASE_URL', ok: present(process.env.SUPABASE_URL) },
    { name: 'SUPABASE_ANON_KEY', ok: present(process.env.SUPABASE_ANON_KEY) },
    // Add or rename below to match the models you actually use:
    { name: 'OPENAI_API_KEY', ok: present(process.env.OPENAI_API_KEY) },
    { name: 'GOOGLE_VEO3_API_KEY', ok: !!process.env.GOOGLE_VEO3_API_KEY }, // optional
  ];

  const ok = checks.every(c => c.ok);
  res.json({
    ok,
    time: new Date().toISOString(),
    checks,
  });
}

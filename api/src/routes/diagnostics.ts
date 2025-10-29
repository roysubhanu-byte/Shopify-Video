import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { validateGoogleApiKey, getGoogleKeySource, getGoogleApiKey } from '../lib/google';
import { Logger } from '../lib/logger';

const router = Router();
const logger = new Logger({ module: 'diagnostics' });

interface DiagnosticCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: any;
}

router.get('/api/diagnostics', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const checks: DiagnosticCheck[] = [];

  logger.info('Running diagnostics');

  checks.push({
    name: 'Environment',
    status: 'ok',
    message: 'Environment loaded',
    details: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      hasAppUrl: !!process.env.APP_URL,
      hasApiUrl: !!process.env.API_URL,
    }
  });

  const googleValidation = validateGoogleApiKey();
  const googleKey = getGoogleApiKey();
  checks.push({
    name: 'Google API Key',
    status: googleValidation.valid ? 'ok' : 'warning',
    message: googleValidation.valid
      ? `Configured via ${googleValidation.source}`
      : googleValidation.error || 'Not configured',
    details: {
      source: getGoogleKeySource(),
      valid: googleValidation.valid,
      keyLength: googleKey ? googleKey.length : 0,
      keyPrefix: googleKey ? googleKey.substring(0, 8) + '...' : 'none',
    }
  });

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    checks.push({
      name: 'Supabase Connection',
      status: error ? 'error' : 'ok',
      message: error ? `Connection failed: ${error.message}` : 'Connected successfully',
      details: {
        hasUrl: !!process.env.SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
        testQuerySuccess: !error,
      }
    });
  } catch (err) {
    checks.push({
      name: 'Supabase Connection',
      status: 'error',
      message: `Connection error: ${err instanceof Error ? err.message : String(err)}`,
      details: {
        hasUrl: !!process.env.SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        error: err instanceof Error ? err.message : String(err),
      }
    });
  }

  checks.push({
    name: 'OpenAI API Key',
    status: process.env.OPENAI_API_KEY ? 'ok' : 'warning',
    message: process.env.OPENAI_API_KEY
      ? 'Configured'
      : 'Not configured - TTS features will be unavailable',
    details: {
      configured: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
    }
  });

  checks.push({
    name: 'ElevenLabs API Key',
    status: process.env.ELEVENLABS_API_KEY ? 'ok' : 'warning',
    message: process.env.ELEVENLABS_API_KEY
      ? 'Configured'
      : 'Not configured - Voice-over features will be unavailable',
    details: {
      configured: !!process.env.ELEVENLABS_API_KEY,
    }
  });

  try {
    const testUrl = 'https://www.google.com';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(testUrl, {
      signal: controller.signal,
      method: 'HEAD'
    });
    clearTimeout(timeout);

    checks.push({
      name: 'External Network',
      status: response.ok ? 'ok' : 'warning',
      message: response.ok
        ? 'Can reach external services'
        : `Network test returned ${response.status}`,
      details: {
        testUrl,
        status: response.status,
        statusText: response.statusText,
      }
    });
  } catch (err) {
    checks.push({
      name: 'External Network',
      status: 'error',
      message: `Cannot reach external services: ${err instanceof Error ? err.message : String(err)}`,
      details: {
        error: err instanceof Error ? err.message : String(err),
      }
    });
  }

  checks.push({
    name: 'CORS Configuration',
    status: 'ok',
    message: 'CORS middleware configured',
    details: {
      allowedOriginPatterns: [
        'Vercel (.vercel.app)',
        'Render (.onrender.com)',
        'WebContainer (.webcontainer-api.io)',
        'Localhost (5173, 4173, 3000)',
      ],
      requestOrigin: req.headers.origin || 'no origin header',
    }
  });

  const hasErrors = checks.some(c => c.status === 'error');
  const hasWarnings = checks.some(c => c.status === 'warning');

  const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy';
  const duration = Date.now() - startTime;

  res.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    duration: `${duration}ms`,
    uptime: Math.floor(process.uptime()),
    checks,
    summary: {
      total: checks.length,
      ok: checks.filter(c => c.status === 'ok').length,
      warnings: checks.filter(c => c.status === 'warning').length,
      errors: checks.filter(c => c.status === 'error').length,
    },
    recommendations: generateRecommendations(checks),
  });

  logger.info('Diagnostics complete', {
    status: overallStatus,
    duration: `${duration}ms`,
    checks: checks.map(c => ({ name: c.name, status: c.status }))
  });
});

function generateRecommendations(checks: DiagnosticCheck[]): string[] {
  const recommendations: string[] = [];

  const googleCheck = checks.find(c => c.name === 'Google API Key');
  if (googleCheck?.status !== 'ok') {
    recommendations.push('Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable for video generation');
  }

  const supabaseCheck = checks.find(c => c.name === 'Supabase Connection');
  if (supabaseCheck?.status === 'error') {
    recommendations.push('Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    recommendations.push('Verify Supabase project is accessible and not paused');
  }

  const openaiCheck = checks.find(c => c.name === 'OpenAI API Key');
  if (openaiCheck?.status !== 'ok') {
    recommendations.push('Set OPENAI_API_KEY environment variable for AI features');
  }

  const networkCheck = checks.find(c => c.name === 'External Network');
  if (networkCheck?.status === 'error') {
    recommendations.push('Check server network connectivity and firewall settings');
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems operational');
  }

  return recommendations;
}

export default router;

// api/src/lib/google.ts
import { Logger } from './logger';

const logger = new Logger({ module: 'google-auth' });

let cachedKey: string | null = null;
let keySource: string | null = null;

export function getGoogleApiKey(): string {
  if (cachedKey !== null) {
    return cachedKey;
  }

  const envVars = [
    { name: 'GOOGLE_API_KEY', value: process.env.GOOGLE_API_KEY },
    { name: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY },
    { name: 'GOOGLE_VEO3_API_KEY', value: process.env.GOOGLE_VEO3_API_KEY },
    { name: 'GOOGLE_AI_API_KEY', value: process.env.GOOGLE_AI_API_KEY },
    { name: 'VEO_API_KEY', value: process.env.VEO_API_KEY },
  ];

  for (const envVar of envVars) {
    if (envVar.value && envVar.value.trim().length > 0) {
      cachedKey = envVar.value.trim();
      keySource = envVar.name;
      logger.info('Google API key found', {
        source: envVar.name,
        keyPrefix: cachedKey.substring(0, 8) + '...',
        keyLength: cachedKey.length,
      });
      return cachedKey;
    }
  }

  logger.error('No Google API key found', {
    checkedVars: envVars.map(v => v.name),
    availableVars: envVars.filter(v => v.value).map(v => v.name),
  });

  cachedKey = '';
  return '';
}

export function hasGoogle(): boolean {
  const key = getGoogleApiKey();
  return key.length > 0;
}

export function getGoogleKeySource(): string | null {
  getGoogleApiKey();
  return keySource;
}

export function validateGoogleApiKey(): { valid: boolean; error?: string; source?: string } {
  const key = getGoogleApiKey();

  if (!key) {
    return {
      valid: false,
      error: 'No Google API key configured. Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.',
    };
  }

  if (key.length < 20) {
    return {
      valid: false,
      error: 'Google API key appears to be invalid (too short).',
      source: keySource || undefined,
    };
  }

  if (!key.startsWith('AIza')) {
    logger.warn('Google API key does not start with expected prefix', {
      prefix: key.substring(0, 4),
      source: keySource,
    });
  }

  return {
    valid: true,
    source: keySource || undefined,
  };
}

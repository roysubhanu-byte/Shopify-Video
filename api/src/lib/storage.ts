import { supabase } from './supabase';
import { Logger } from './logger';
import fs from 'fs/promises';
import path from 'path';

const logger = new Logger({ module: 'storage' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = process.env.API_URL || 'http://localhost:8787';

export async function uploadPublic(
  buffer: Buffer,
  filePath: string,
  contentType: string
): Promise<string> {
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      logger.info('Uploading to Supabase Storage', {
        path: filePath,
        size: buffer.length,
        contentType,
      });

      const { data, error } = await supabase.storage
        .from('public')
        .upload(filePath, buffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        logger.error('Supabase Storage upload failed', { error, path: filePath });
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      logger.info('File uploaded to Supabase Storage', {
        path: filePath,
        url: urlData.publicUrl,
      });

      return urlData.publicUrl;
    } catch (error) {
      logger.error('Failed to upload to Supabase Storage, falling back to local', {
        error,
        path: filePath,
      });
    }
  }

  logger.info('Using local filesystem storage', { path: filePath });

  const tmpDir = '/tmp/hoba-static';
  await fs.mkdir(tmpDir, { recursive: true });

  const fullPath = path.join(tmpDir, filePath);
  const dirPath = path.dirname(fullPath);
  await fs.mkdir(dirPath, { recursive: true });

  await fs.writeFile(fullPath, buffer);

  const publicUrl = `${API_URL}/static/${filePath}`;

  logger.info('File saved to local filesystem', {
    path: fullPath,
    url: publicUrl,
  });

  return publicUrl;
}

export async function serveStaticFile(filePath: string): Promise<Buffer | null> {
  try {
    const tmpDir = '/tmp/hoba-static';
    const fullPath = path.join(tmpDir, filePath);

    const buffer = await fs.readFile(fullPath);

    logger.info('Static file served', { path: filePath, size: buffer.length });

    return buffer;
  } catch (error) {
    logger.error('Failed to serve static file', { error, path: filePath });
    return null;
  }
}

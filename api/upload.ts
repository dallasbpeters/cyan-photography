import { randomUUID } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import { getBearerUser } from './_lib/auth';
import { handleCors } from './_lib/cors';
import { parseJsonBody } from './_lib/parseBody';

const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getBearerUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return res.status(503).json({
      error: 'Upload storage is not configured',
      hint:
        'Vercel → Project → Storage → Blob → create/link store, then set BLOB_READ_WRITE_TOKEN on the project (all envs). For local `vercel dev`, add it to .env.development.local or run `vercel env pull`. See .env.example and https://vercel.com/docs/storage/vercel-blob',
    });
  }

  const body = parseJsonBody(req.body);
  const filenameRaw = typeof body.filename === 'string' ? body.filename : 'image';
  const contentType = typeof body.contentType === 'string' ? body.contentType.trim() : '';
  const b64 = typeof body.file === 'string' ? body.file.trim() : '';

  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    return res.status(400).json({ error: 'Use JPEG, PNG, WebP, or GIF only' });
  }
  if (!b64) {
    return res.status(400).json({ error: 'Missing file payload' });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(b64, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid file encoding' });
  }

  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    return res.status(400).json({ error: `Image must be under ${MAX_BYTES / (1024 * 1024)}MB` });
  }

  const safeName = filenameRaw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'image';
  const pathname = `portfolio/${user.userId}/${randomUUID()}-${safeName}`;

  try {
    const blob = await put(pathname, buffer, {
      access: 'public',
      token,
      contentType,
      addRandomSuffix: false,
    });
    return res.status(200).json({ url: blob.url });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'Upload to storage failed' });
  }
}

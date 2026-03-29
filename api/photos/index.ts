import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NeonDbError } from '@neondatabase/serverless';
import { getSql } from '../_lib/db.js';
import { getBearerUser } from '../_lib/auth.js';
import { handleCors } from '../_lib/cors.js';
import { rowToDto, type PhotoRow } from '../_lib/photos.js';
import { parseJsonBody } from '../_lib/parseBody.js';
import { parsePublicHttpUrl, sanitizeText } from '../_lib/httpUrl.js';

const isDev =
  process.env.VERCEL_ENV === 'development' ||
  process.env.NODE_ENV !== 'production';

const mapDbError = (e: NeonDbError): { status: number; error: string } | null => {
  const code = e.code;
  if (code === '42P01' || code === '42703') {
    return {
      status: 503,
      error:
        'Database schema is missing or out of date. Run migrations (pnpm db:migrate) against the database used by this deployment.',
    };
  }
  if (code === '23503') {
    if (e.constraint?.includes('created_by')) {
      return {
        status: 401,
        error: 'Your session no longer matches the database. Sign out and sign in again.',
      };
    }
    return { status: 400, error: 'Invalid category or user reference.' };
  }
  if (code === '22001') {
    return {
      status: 400,
      error: 'That URL or title is too long. Try a shorter image link or upload the file instead.',
    };
  }
  if (code === '22P02') {
    return { status: 400, error: 'Invalid data sent to the server. Check category and try again.' };
  }
  return null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  try {
    const sql = getSql();

    if (req.method === 'GET') {
      const rows = (await sql`
        SELECT p.id, p.url, p.title, p.sort_order, p.created_at,
          c.id AS category_id, c.slug AS category_slug, c.label AS category_label
        FROM photos p
        INNER JOIN categories c ON c.id = p.category_id
        ORDER BY p.sort_order ASC, p.created_at ASC
      `) as PhotoRow[];
      return res.status(200).json(rows.map(rowToDto));
    }

    if (req.method === 'POST') {
      const user = getBearerUser(req.headers.authorization);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const body = parseJsonBody(req.body);
      const rawUrl = typeof body.url === 'string' ? body.url : '';
      const url = parsePublicHttpUrl(rawUrl);
      const title = typeof body.title === 'string' ? sanitizeText(body.title) : '';
      const categoryId =
        typeof body.categoryId === 'string' ? sanitizeText(body.categoryId) : '';
      const order = typeof body.order === 'number' ? body.order : Number(body.order);

      if (!url) {
        return res.status(400).json({
          error: 'Invalid image URL. Use a full https:// link (e.g. from Unsplash).',
        });
      }
      if (!title || !categoryId) {
        return res.status(400).json({ error: 'Invalid url, title, or categoryId' });
      }
      if (!Number.isFinite(order)) {
        return res.status(400).json({ error: 'Invalid order' });
      }

      const catOk = await sql`SELECT id FROM categories WHERE id = ${categoryId} LIMIT 1`;
      if (catOk.length === 0) {
        return res.status(400).json({ error: 'Unknown category' });
      }

      const inserted = (await sql.query(
        `INSERT INTO photos (url, title, category_id, sort_order, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [url, title, categoryId, order, user.userId],
      )) as { id: string }[];

      const newId = inserted[0]?.id;
      if (!newId) {
        return res.status(500).json({ error: 'Insert failed' });
      }

      const rows = (await sql`
        SELECT p.id, p.url, p.title, p.sort_order, p.created_at,
          c.id AS category_id, c.slug AS category_slug, c.label AS category_label
        FROM photos p
        INNER JOIN categories c ON c.id = p.category_id
        WHERE p.id = ${newId}
        LIMIT 1
      `) as PhotoRow[];

      const row = rows[0];
      if (!row) {
        return res.status(500).json({ error: 'Insert failed' });
      }
      return res.status(201).json(rowToDto(row));
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : '';
    if (message.includes('Missing database URL') || message.includes('DATABASE_URL')) {
      return res.status(503).json({
        error:
          'Database is not configured for this deployment. Add DATABASE_URL or connect Neon/Postgres on Vercel.',
      });
    }
    if (e instanceof NeonDbError) {
      const mapped = mapDbError(e);
      if (mapped) {
        return res.status(mapped.status).json({ error: mapped.error });
      }
    }
    return res.status(500).json({
      error: 'Request failed',
      ...(isDev && message ? { debug: message } : {}),
    });
  }
}

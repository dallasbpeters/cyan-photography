import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSql } from '../_lib/db';
import { getBearerUser } from '../_lib/auth';
import { rowToDto, type PhotoRow } from '../_lib/photos';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sql = getSql();

    if (req.method === 'GET') {
      const rows = (await sql`
        SELECT id, url, title, category, sort_order, created_at
        FROM photos
        ORDER BY sort_order ASC, created_at ASC
      `) as PhotoRow[];
      return res.status(200).json(rows.map(rowToDto));
    }

    if (req.method === 'POST') {
      const user = getBearerUser(req.headers.authorization);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const raw = req.body;
      const body = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;
      const url = typeof body?.url === 'string' ? body.url.trim() : '';
      const title = typeof body?.title === 'string' ? body.title.trim() : '';
      const category = body?.category;
      const order = typeof body?.order === 'number' ? body.order : Number(body?.order);

      if (!url || !title || (category !== 'film' && category !== 'photography')) {
        return res.status(400).json({ error: 'Invalid url, title, or category' });
      }
      if (!Number.isFinite(order)) {
        return res.status(400).json({ error: 'Invalid order' });
      }

      const inserted = (await sql`
        INSERT INTO photos (url, title, category, sort_order, created_by)
        VALUES (${url}, ${title}, ${category}, ${order}, ${user.userId})
        RETURNING id, url, title, category, sort_order, created_at
      `) as PhotoRow[];

      const row = inserted[0];
      if (!row) {
        return res.status(500).json({ error: 'Insert failed' });
      }
      return res.status(201).json(rowToDto(row));
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Request failed' });
  }
}

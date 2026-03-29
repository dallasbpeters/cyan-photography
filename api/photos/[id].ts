import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSql } from '../_lib/db';
import { getBearerUser } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = getBearerUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id : req.query.id?.[0];
  if (!id) {
    return res.status(400).json({ error: 'Missing photo id' });
  }

  try {
    const sql = getSql();
    const deleted = await sql`
      DELETE FROM photos
      WHERE id = ${id}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    return res.status(204).end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Delete failed' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSql } from '../_lib/db';
import { signToken, verifyPassword } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import { parseJsonBody } from '../_lib/parseBody';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = parseJsonBody(req.body);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const sql = getSql();
    const rows = await sql`
      SELECT id, email, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    const row = rows[0] as { id: string; email: string; password_hash: string } | undefined;
    if (!row || !verifyPassword(password, row.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ sub: row.id, email: row.email });
    return res.status(200).json({
      token,
      user: { id: row.id, email: row.email },
    });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('JWT_SECRET')) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured.' });
    }
    if (msg.includes('DATABASE_URL')) {
      return res.status(500).json({ error: 'DATABASE_URL is not configured.' });
    }
    return res.status(500).json({ error: 'Login failed' });
  }
}

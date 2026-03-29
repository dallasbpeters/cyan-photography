import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { INITIAL_PHOTOS_SEED } from '../src/data/initialPhotos';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const email = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@cyan.test').trim().toLowerCase();
const password = process.env.DEFAULT_ADMIN_PASSWORD;
if (!password || password.length < 8) {
  throw new Error('DEFAULT_ADMIN_PASSWORD is required (min 8 characters)');
}

const client = new pg.Client({ connectionString });
await client.connect();
try {
  const passwordHash = bcrypt.hashSync(password, 10);
  const userRes = await client.query<{ id: string }>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [email, passwordHash],
  );
  const userId = userRes.rows[0]?.id;
  if (!userId) {
    throw new Error('Failed to upsert admin user');
  }

  const countRes = await client.query<{ c: string }>(
    'SELECT COUNT(*)::text AS c FROM photos',
  );
  const existing = Number.parseInt(countRes.rows[0]?.c ?? '0', 10);
  if (existing > 0) {
    console.log(`Skipped photo seed (${existing} rows already present).`);
    console.log(`Admin: ${email}`);
  } else {
    for (const p of INITIAL_PHOTOS_SEED) {
      await client.query(
        `INSERT INTO photos (url, title, category, sort_order, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [p.url, p.title, p.category, p.order, userId],
      );
    }
    console.log(`Seeded ${INITIAL_PHOTOS_SEED.length} photos.`);
    console.log(`Admin login: ${email}`);
  }
} finally {
  await client.end();
}

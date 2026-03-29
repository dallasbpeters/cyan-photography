import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { loadEnv } from './loadEnv';

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is required (Neon connection string in .env, .env.local, or .env.development.local)',
  );
}

const client = new pg.Client({ connectionString });
await client.connect();
try {
  const schemaSql = readFileSync(join(root, 'db/schema.sql'), 'utf8');
  await client.query(schemaSql);
  const patchSql = readFileSync(join(root, 'db/patches/001_legacy_photo_categories.sql'), 'utf8');
  await client.query(patchSql);
  console.log('Migration finished.');
} finally {
  await client.end();
}

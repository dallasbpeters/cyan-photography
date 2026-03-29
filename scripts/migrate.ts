import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required (Neon connection string)');
}

const client = new pg.Client({ connectionString });
await client.connect();
try {
  const sql = readFileSync(join(root, 'db/schema.sql'), 'utf8');
  await client.query(sql);
  console.log('Migration finished.');
} finally {
  await client.end();
}

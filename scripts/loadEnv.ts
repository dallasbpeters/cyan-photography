import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Same rough precedence as Vite: later files override earlier. */
export const loadEnv = (): void => {
  config({ path: join(root, '.env') });
  config({ path: join(root, '.env.local'), override: true });
  config({ path: join(root, '.env.development.local'), override: true });
};

import { neon } from '@neondatabase/serverless';
import { bootstrapEnv } from './bootstrapEnv';

bootstrapEnv();

export const getSql = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(url);
};

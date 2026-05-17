import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

const url =
  process.env.DATABASE_URL ??
  [
    'postgresql://',
    process.env.POSTGRES_USER,
    ':',
    process.env.POSTGRES_PASSWORD,
    '@',
    process.env.POSTGRES_HOST,
    ':',
    process.env.POSTGRES_PORT,
    '/',
    process.env.POSTGRES_DB,
  ].join('');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url },
  verbose: true,
  strict: true,
});

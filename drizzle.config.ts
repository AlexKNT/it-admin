import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit runs outside Next.js, so .env.local is loaded by hand.
config({ path: '.env.local' });

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL is not set. Add it to .env.local.');
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
});

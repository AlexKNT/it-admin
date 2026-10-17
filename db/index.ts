import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  // One client survives dev hot reloads instead of leaking a pool per edit.
  var __sql: postgres.Sql | undefined;
}

function createClient(url: string) {
  return postgres(url, {
    prepare: false,
    max: 1,
    connect_timeout: 10,
  });
}

export function getDb() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is not set. Add it to .env.local.');
  }

  const sql = globalThis.__sql ?? (globalThis.__sql = createClient(url));

  return drizzle(sql, { schema });
}

export async function closeDb() {
  if (globalThis.__sql) {
    const sql = globalThis.__sql;
    globalThis.__sql = undefined;
    await sql.end();
  }
}

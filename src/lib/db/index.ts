import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle> | null = null;

if (connectionString) {
  try {
    const client = postgres(connectionString);
    db = drizzle(client, { schema });
    console.log('[DB] Connected to PostgreSQL via Drizzle');
  } catch (err) {
    console.error('[DB] Failed to connect to PostgreSQL:', err);
    console.log('[DB] Falling back to in-memory store');
  }
} else {
  console.log('[DB] DATABASE_URL not set, using in-memory store');
}

export { db };
export const isDatabaseEnabled = db !== null;

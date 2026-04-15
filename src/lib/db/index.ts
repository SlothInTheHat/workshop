import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Mutable live binding — importers see the updated value after initDb() is called.
// Live workshop routes use:  import { db, isDatabaseEnabled } from '$lib/db/index.js'
// Pre-workshop routes use:   import { getDb, schema } from '$lib/db/index'
export let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function initDb(connectionString: string) {
	if (db) return db;
	try {
		const client = postgres(connectionString);
		db = drizzle(client, { schema });
		console.log('[DB] Connected to PostgreSQL via Drizzle');
	} catch (err) {
		console.error('[DB] Failed to connect:', err);
	}
	return db;
}

/** Used by pre-workshop API routes — throws if DATABASE_URL was never set. */
export function getDb() {
	return db;
}

/** Checked by live workshop routes as  if (isDatabaseEnabled) { ... } */
export const isDatabaseEnabled = () => db !== null;

export { schema };

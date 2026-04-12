import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Module-level connection (used by live workshop routes)
const connectionString = process.env.DATABASE_URL;

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

if (connectionString) {
	try {
		const client = postgres(connectionString);
		_db = drizzle(client, { schema });
		console.log('[DB] Connected to PostgreSQL via Drizzle');
	} catch (err) {
		console.error('[DB] Failed to connect to PostgreSQL:', err);
	}
} else {
	console.log('[DB] DATABASE_URL not set, using in-memory store for live workshop');
}

// Named export for live workshop routes: import { db, isDatabaseEnabled }
export const db = _db;
export const isDatabaseEnabled = _db !== null;

// Factory export for pre-workshop routes: import { getDb }
// Throws at call time (not module load) so the app boots without DATABASE_URL
export function getDb() {
	if (!_db) {
		const url = process.env.DATABASE_URL;
		if (!url) {
			throw new Error(
				'DATABASE_URL is not set. Add it to your .env file to use pre-workshop features.'
			);
		}
		const client = postgres(url);
		_db = drizzle(client, { schema });
	}
	return _db;
}

export { schema };

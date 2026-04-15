import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function initDb(connectionString: string) {
	if (_db) return _db;
	try {
		const client = postgres(connectionString);
		_db = drizzle(client, { schema });
		console.log('[DB] Connected to PostgreSQL via Drizzle');
	} catch (err) {
		console.error('[DB] Failed to connect:', err);
	}
	return _db;
}

export function getDb() {
	return _db;
}

export const isDatabaseEnabled = () => _db !== null;

export { schema };

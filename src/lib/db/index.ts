import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// Live bindings — importers see the updated value after initDb() runs
export let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
export let isDatabaseEnabled = false;

export function initDb(connectionString: string) {
	if (db) return db;
	try {
		const pool = new Pool({
			connectionString,
			ssl: connectionString.includes('supabase') || connectionString.includes('sslmode=require')
				? { rejectUnauthorized: false }
				: false,
		});
		db = drizzle(pool, { schema });
		isDatabaseEnabled = true;
		console.log('[DB] Connected via pg');
	} catch (err) {
		console.error('[DB] Connection failed:', err);
	}
	return db;
}

export function getDb() {
	return db;
}

export { schema };
export type DB = typeof db;

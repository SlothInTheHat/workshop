import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

let _db: ReturnType<typeof drizzle> | null = null;

export function initDb(connectionString: string) {
	if (_db) return _db;
	try {
		const pool = new Pool({ connectionString });
		_db = drizzle(pool, { schema });
		console.log('[DB] Connected via pg');
	} catch (err) {
		console.error('[DB] Connection failed:', err);
	}
	return _db;
}

export function getDb() {
	return _db;
}

export { schema };
export type DB = typeof _db;

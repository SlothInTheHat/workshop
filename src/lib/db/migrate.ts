import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export async function runMigrations(connectionString: string) {
	if (!connectionString) return;
	try {
		const client = postgres(connectionString, { max: 1 });
		const db = drizzle(client);
		console.log('[Migrations] Running migrations...');
		await migrate(db, { migrationsFolder: './drizzle' });
		console.log('[Migrations] Migrations completed successfully');
		await client.end();
	} catch (err) {
		console.warn('[Migrations] Failed to run migrations:', err.message);
	}
}

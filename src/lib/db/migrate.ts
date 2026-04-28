import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { join } from 'path';

export async function runMigrations(connectionString: string) {
	if (!connectionString) return;
	// process.cwd() is the project root both locally and during Vercel build
	const migrationsFolder = join(process.cwd(), 'drizzle');
	try {
		const client = postgres(connectionString, {
			max: 1,
			ssl: connectionString.includes('supabase') || connectionString.includes('sslmode=require')
				? { rejectUnauthorized: false }
				: undefined,
		});
		const db = drizzle(client);
		console.log('[Migrations] Running migrations...');
		await migrate(db, { migrationsFolder });
		console.log('[Migrations] Migrations completed successfully');
		await client.end();
	} catch (err) {
		console.warn('[Migrations] Failed to run migrations:', (err as Error).message);
	}
}

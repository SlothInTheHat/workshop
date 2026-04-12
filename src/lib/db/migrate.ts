import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('[Migrations] DATABASE_URL not set, skipping migrations');
    return;
  }

  try {
    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client);

    console.log('[Migrations] Running migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('[Migrations] Migrations completed successfully');

    await client.end();
  } catch (err) {
    console.error('[Migrations] Failed to run migrations:', err);
    throw err;
  }
}

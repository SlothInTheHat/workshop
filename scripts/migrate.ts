import { runMigrations } from '../src/lib/db/migrate.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

console.log('Running migrations against:', url.replace(/:([^@]+)@/, ':****@'));
await runMigrations(url);
console.log('Done.');

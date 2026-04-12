import type { Handle } from '@sveltejs/kit';
import { runMigrations } from '$lib/db/migrate.js';
import { seedIfEmpty } from '$lib/db/seed.js';

let initialized = false;

export const handle: Handle = async ({ event, resolve }) => {
  // Run migrations and seed on first request
  if (!initialized && process.env.DATABASE_URL) {
    try {
      await runMigrations();
      await seedIfEmpty();
      initialized = true;
    } catch (err) {
      console.error('[Hooks] Failed to initialize database:', err);
    }
  }
  return resolve(event);
};

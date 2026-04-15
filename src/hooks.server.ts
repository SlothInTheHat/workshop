import type { Handle } from '@sveltejs/kit';
import { DATABASE_URL } from '$env/static/private';
import { initDb } from '$lib/db/index';
import { runMigrations } from '$lib/db/migrate';
import { seedIfEmpty } from '$lib/db/seed';

let initialized = false;

export const handle: Handle = async ({ event, resolve }) => {
	if (!initialized) {
		initialized = true;
		try {
			if (DATABASE_URL) {
				initDb(DATABASE_URL);
				await runMigrations(DATABASE_URL);
				await seedIfEmpty();
			}
		} catch (err) {
			console.warn('[Hooks] DB init failed:', (err as Error).message);
		}
	}
	return resolve(event);
};

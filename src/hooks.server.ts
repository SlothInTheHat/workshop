import type { Handle } from '@sveltejs/kit';
import { initDb } from '$lib/db/index';
import { runMigrations } from '$lib/db/migrate';
import { seedIfEmpty } from '$lib/db/seed';

let initialized = false;

export const handle: Handle = async ({ event, resolve }) => {
	if (!initialized) {
		initialized = true;
		try {
			const url = process.env.DATABASE_URL;
			if (url) {
				initDb(url);
				await runMigrations(url);
				await seedIfEmpty();
			}
		} catch (err) {
			console.warn('[Hooks] DB init failed:', (err as Error).message);
		}
	}
	return resolve(event);
};

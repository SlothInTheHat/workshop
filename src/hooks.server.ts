import type { Handle } from '@sveltejs/kit';
import { DATABASE_URL } from '$env/static/private';
import { initDb } from '$lib/db/index';
import { runMigrations } from '$lib/db/migrate';

let initialized = false;

export const handle: Handle = async ({ event, resolve }) => {
	if (!initialized) {
		initialized = true;
		if (DATABASE_URL) {
			await runMigrations(DATABASE_URL);
			initDb(DATABASE_URL);
		}
	}
	return resolve(event);
};

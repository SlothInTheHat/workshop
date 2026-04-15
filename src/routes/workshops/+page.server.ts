import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = getSession(cookies);
	if (!session) redirect(303, '/join?return=/workshops');

	const db = getDb();

	if (!db) {
		return { session, workshops: [] };
	}

	const workshopRows = await db
		.select()
		.from(schema.workshops);

	const workshops = await Promise.all(
		workshopRows.map(async (w) => {
			const participants = await db
				.select()
				.from(schema.participants)
				.where(eq(schema.participants.workshopId, w.id));

			return {
				...w,
				participantCount: participants.length,
			};
		})
	);

	return {
		session,
		workshops
	};
};

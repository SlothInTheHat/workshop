import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = getSession(cookies);
	if (!session) redirect(303, '/join?return=/workshops');

	// Contributors with a session workshopId go directly to their workshop
	if (session.role === 'contributor' && session.workshopId) {
		redirect(303, `/workshops/${session.workshopId}/contributor`);
	}

	const db = getDb();

	if (!db) {
		return { session, workshops: [] };
	}

	// If session has a workshopId (facilitator joined via a specific code), only show that workshop
	let workshopRows;
	if (session.workshopId) {
		workshopRows = await db
			.select()
			.from(schema.preWorkshops)
			.where(eq(schema.preWorkshops.id, session.workshopId));
	} else {
		workshopRows = await db
			.select()
			.from(schema.preWorkshops)
			.where(eq(schema.preWorkshops.tenantId, session.tenantId))
			.orderBy(schema.preWorkshops.createdAt);
	}

	const workshops = await Promise.all(
		workshopRows.map(async (w) => {
			const pts = await db
				.select()
				.from(schema.preParticipants)
				.where(eq(schema.preParticipants.workshopId, w.id));

			const inputs = await db
				.select()
				.from(schema.contributorInputs)
				.where(eq(schema.contributorInputs.workshopId, w.id));

			const contributors = pts.filter((p) => p.role === 'contributor');
			const submittedCount = inputs.filter((i) => i.status === 'completed').length;

			return {
				...w,
				participantCount: pts.length,
				contributorCount: contributors.length,
				submittedCount
			};
		})
	);

	return { session, workshops };
};

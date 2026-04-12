import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = getSession(cookies);
	if (!session) redirect(303, '/join?return=/workshops');

	const db = getDb();
	const tenantId = session.tenantId;

	const workshopRows = await db
		.select()
		.from(schema.workshops)
		.where(eq(schema.workshops.tenantId, tenantId))
		.orderBy(schema.workshops.createdAt);

	const workshops = await Promise.all(
		workshopRows.map(async (w) => {
			const participants = await db
				.select()
				.from(schema.participants)
				.where(eq(schema.participants.workshopId, w.id));

			const inputs = await db
				.select()
				.from(schema.contributorInputs)
				.where(eq(schema.contributorInputs.workshopId, w.id));

			const submittedCount = inputs.filter((i) => i.status === 'completed').length;
			const contributorCount = participants.filter((p) => p.role === 'contributor').length;

			return {
				...w,
				participantCount: participants.length,
				contributorCount,
				submittedCount
			};
		})
	);

	return {
		session,
		workshops
	};
};

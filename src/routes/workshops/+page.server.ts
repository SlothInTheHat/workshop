import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';
import { getDb, schema } from '$lib/db/index';
import { eq, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = getSession(cookies);
	// No session — show empty dashboard, not join page
	if (!session) return { session: null, workshops: [] };

	const db = getDb();

	if (!db) {
		return { session, workshops: [] };
	}

	// Find all workshops the user is associated with:
	// 1. As lead facilitator (created by them)
	// 2. As a named participant in pre_participants
	const [asFacilitator, asParticipant] = await Promise.all([
		db.select({ id: schema.preWorkshops.id })
			.from(schema.preWorkshops)
			.where(eq(schema.preWorkshops.leadFacilitatorName, session.name)),
		db.select({ workshopId: schema.preParticipants.workshopId })
			.from(schema.preParticipants)
			.where(eq(schema.preParticipants.name, session.name)),
	]);

	const workshopIds = [...new Set([
		...asFacilitator.map(r => r.id),
		...asParticipant.map(r => r.workshopId),
	])];

	if (workshopIds.length === 0) {
		return { session, workshops: [] };
	}

	const workshopRows = await db
		.select()
		.from(schema.preWorkshops)
		.where(inArray(schema.preWorkshops.id, workshopIds))
		.orderBy(schema.preWorkshops.createdAt);

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
				submittedCount,
			};
		})
	);

	return { session, workshops };
};

import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const session = getSession(cookies);
	if (!session) redirect(303, `/join?return=/workshops/${params.id}/pre`);
	if (session.role !== 'facilitator') redirect(303, `/workshops/${params.id}/contributor`);

	const db = getDb();

	if (!db) {
		return {
			session,
			workshop: {
				id: params.id,
				tenantId: 'default',
				title: 'Workshop',
				focusArea: null,
				objective: null,
				status: 'pre',
				dataSensitivity: 'internal',
				leadFacilitatorName: null,
				aiContext: null,
				kickoffSummary: null,
				facilitatorCode: null,
				contributorCode: null,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			participants: [],
			inputs: [],
			artifacts: [],
			activityLog: [],
			stats: { contributorCount: 0, submittedCount: 0, inProgressCount: 0 }
		};
	}

	const workshopRows = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.id, params.id));

	if (workshopRows.length === 0) error(404, 'Workshop not found');
	const workshop = workshopRows[0];

	const participants = await db
		.select()
		.from(schema.preParticipants)
		.where(eq(schema.preParticipants.workshopId, params.id))
		.orderBy(schema.preParticipants.createdAt);

	const inputs = await db
		.select()
		.from(schema.contributorInputs)
		.where(eq(schema.contributorInputs.workshopId, params.id));

	const artifacts = await db
		.select()
		.from(schema.artifacts)
		.where(eq(schema.artifacts.workshopId, params.id))
		.orderBy(schema.artifacts.createdAt);

	const activityLog = await db
		.select()
		.from(schema.activityLogs)
		.where(eq(schema.activityLogs.workshopId, params.id))
		.orderBy(schema.activityLogs.createdAt);

	const participantsWithStatus = participants.map((p) => {
		const input = inputs.find((i) => i.participantId === p.id);
		return {
			...p,
			inputStatus: input?.status ?? 'pending',
			completionPct: input?.completionPct ?? 0
		};
	});

	const contributorCount = participants.filter((p) => p.role === 'contributor').length;
	const submittedCount = inputs.filter((i) => i.status === 'completed').length;
	const inProgressCount = inputs.filter((i) => i.status === 'in_progress').length;

	return {
		session,
		workshop,
		participants: participantsWithStatus,
		inputs,
		artifacts,
		activityLog: activityLog.reverse(),
		stats: { contributorCount, submittedCount, inProgressCount }
	};
};

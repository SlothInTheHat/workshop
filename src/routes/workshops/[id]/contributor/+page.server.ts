import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';
import { getDb, schema } from '$lib/db/index';
import { eq, and, ilike } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const session = getSession(cookies);
	if (!session) redirect(303, `/join?return=/workshops/${params.id}/contributor`);

	const db = getDb();

	if (!db) {
		return {
			session,
			workshop: {
				id: params.id,
				tenantId: 'default',
				title: 'Workshop',
				status: 'pre',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			participant: null,
			existingInput: null,
			artifacts: []
		};
	}

	const workshopRows = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.id, params.id));

	if (workshopRows.length === 0) error(404, 'Workshop not found');
	const workshop = workshopRows[0];

	if (workshop.status === 'live') {
		redirect(303, `/workshop/${params.id}/live`);
	} else if (workshop.status === 'completed') {
		redirect(303, `/workshops/${params.id}/post/contributor`);
	} else if (workshop.status !== 'pre') {
		redirect(303, '/workshops');
	}

	// Find or auto-create a participant record for this contributor by name
	const existingParticipants = await db
		.select()
		.from(schema.preParticipants)
		.where(
			and(
				eq(schema.preParticipants.workshopId, params.id),
				ilike(schema.preParticipants.name, session.name.trim())
			)
		);

	let participant = existingParticipants[0] ?? null;

	if (!participant) {
		const newId = crypto.randomUUID();
		await db.insert(schema.preParticipants).values({
			id: newId,
			workshopId: params.id,
			tenantId: workshop.tenantId,
			name: session.name.trim(),
			email: null,
			role: 'contributor',
			status: 'pending',
			createdAt: new Date()
		});
		const created = await db
			.select()
			.from(schema.preParticipants)
			.where(eq(schema.preParticipants.id, newId));
		participant = created[0];
	}

	const inputRows = await db
		.select()
		.from(schema.contributorInputs)
		.where(
			and(
				eq(schema.contributorInputs.workshopId, params.id),
				eq(schema.contributorInputs.participantId, participant.id)
			)
		);

	const existingInput = inputRows[0] ?? null;

	const artifacts = await db
		.select()
		.from(schema.artifacts)
		.where(
			and(
				eq(schema.artifacts.workshopId, params.id),
				eq(schema.artifacts.visibility, 'all')
			)
		);

	return {
		session,
		workshop,
		participant,
		existingInput,
		artifacts
	};
};

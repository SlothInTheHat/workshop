import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';
import { getDb, schema } from '$lib/db/index';
import { eq, and, ilike } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const session = getSession(cookies);
	if (!session) redirect(303, `/join?return=/workshops/${params.id}/contributor`);

	const db = getDb();

	// If no database, return mock data
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
		.from(schema.workshops)
		.where(eq(schema.workshops.id, params.id));

	if (workshopRows.length === 0) error(404, 'Workshop not found');
	const workshop = workshopRows[0];

	if (workshop.status !== 'pre') {
		// Workshop not in pre-workshop phase
		redirect(303, '/workshops');
	}

	// Find or auto-create a participant record for this contributor by name
	const existingParticipants = await db
		.select()
		.from(schema.participants)
		.where(
			and(
				eq(schema.participants.workshopId, params.id),
				ilike(schema.participants.name, session.name.trim())
			)
		);

	let participant = existingParticipants[0] ?? null;

	// If no participant found, create one automatically
	if (!participant) {
		const newId = crypto.randomUUID();
		await db.insert(schema.participants).values({
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
			.from(schema.participants)
			.where(eq(schema.participants.id, newId));
		participant = created[0];
	}

	// Fetch existing input for this participant
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

	// Artifacts visible to contributors
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

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';
import { setWorkshopContext, createTeam } from '$lib/workshop/store';

// GET /api/workshops/[id]
export const GET: RequestHandler = async ({ params }) => {
	const db = getDb();
	if (!db) error(503, 'Database not available');

	const rows = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.id, params.id));

	if (rows.length === 0) error(404, 'Workshop not found');

	const workshop = rows[0];
	const participants = await db
		.select()
		.from(schema.preParticipants)
		.where(eq(schema.preParticipants.workshopId, params.id));

	const inputs = await db
		.select()
		.from(schema.contributorInputs)
		.where(eq(schema.contributorInputs.workshopId, params.id));

	const artifacts = await db
		.select()
		.from(schema.artifacts)
		.where(eq(schema.artifacts.workshopId, params.id));

	const activityLog = await db
		.select()
		.from(schema.activityLogs)
		.where(eq(schema.activityLogs.workshopId, params.id))
		.orderBy(schema.activityLogs.createdAt);

	return json({ workshop, participants, inputs, artifacts, activityLog });
};

// PATCH /api/workshops/[id]
export const PATCH: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	if (!db) error(503, 'Database not available');

	const body = (await request.json()) as {
		title?: string;
		focusArea?: string;
		objective?: string;
		status?: string;
		dataSensitivity?: string;
		aiContext?: string;
		kickoffSummary?: string;
		teams?: {name: string}[];
		actorName?: string;
	};

	const existing = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.id, params.id));
	if (existing.length === 0) error(404, 'Workshop not found');

	const updates: Partial<typeof schema.preWorkshops.$inferInsert> = { updatedAt: new Date() };
	if (body.title !== undefined) updates.title = body.title;
	if (body.focusArea !== undefined) updates.focusArea = body.focusArea;
	if (body.objective !== undefined) updates.objective = body.objective;
	if (body.status !== undefined) updates.status = body.status;
	if (body.dataSensitivity !== undefined) updates.dataSensitivity = body.dataSensitivity;
	if (body.aiContext !== undefined) updates.aiContext = body.aiContext;
	if (body.kickoffSummary !== undefined) updates.kickoffSummary = body.kickoffSummary;
	if (body.teams !== undefined) updates.teams = body.teams;

	await db.update(schema.preWorkshops).set(updates).where(eq(schema.preWorkshops.id, params.id));

	if (body.status === 'live') {
		await db.insert(schema.activityLogs).values({
			id: crypto.randomUUID(),
			workshopId: params.id,
			tenantId: existing[0].tenantId,
			actorName: body.actorName ?? 'Facilitator',
			action: 'workshop_launched',
			details: 'Workshop moved to live phase',
			createdAt: new Date()
		});

		// Copy pre-workshop data to live workshop
		try {
			// Get workshop details
			const workshop = await db.select()
				.from(schema.preWorkshops)
				.where(eq(schema.preWorkshops.id, params.id))
				.limit(1);

			// Get all contributor inputs
			const inputs = await db.select()
				.from(schema.contributorInputs)
				.where(eq(schema.contributorInputs.workshopId, params.id));

			// Get participants
			const participants = await db.select()
				.from(schema.preParticipants)
				.where(eq(schema.preParticipants.workshopId, params.id));

			if (workshop[0]) {
				const w = workshop[0];
				setWorkshopContext(params.id, {
					title: w.title,
					client: w.tenantId,
					objective: w.objective ?? '',
					aiContext: w.aiContext ?? '',
					strategicPillars: w.strategicPillars ?? [],
					contributorInputs: inputs.map(input => {
						const p = participants.find(
							p => p.id === input.participantId
						);
						return {
							name: p?.name ?? 'Anonymous',
							goals: input.goalsAndObjectives ?? '',
							painPoints: input.painPoints ?? '',
							constraints: input.constraints ?? '',
							successCriteria: input.successCriteria ?? '',
						};
					})
				});
				console.log('[Launch] Pre-workshop data copied to live workshop');

				// Ensure a live workshops record exists for the overview API
				try {
					await db.insert(schema.workshops).values({
						id: params.id,
						title: w.title,
						client: w.tenantId ?? 'default',
						status: 'setup',
						joinCode: w.facilitatorCode ?? params.id,
						createdAt: new Date(),
					});
				} catch {
					// Already exists — update status
					await db.update(schema.workshops)
						.set({ status: 'setup' })
						.where(eq(schema.workshops.id, params.id));
				}

				// Create teams in DB (persists across serverless instances)
				const preTeams = (w.teams ?? []) as { name: string }[];
				const teamsToCreate = preTeams.length > 0 ? preTeams : [{ name: 'Team A' }, { name: 'Team B' }];

				for (const team of teamsToCreate) {
					const teamId = crypto.randomUUID();
					try {
						await db.insert(schema.breakoutTeams).values({
							id: teamId,
							workshopId: params.id,
							name: team.name,
							memberIds: [],
							createdAt: new Date(),
						});
						// Also create in memory for SSE broadcast
						createTeam(params.id, team.name, []);
					} catch {
						// team may already exist
					}
					console.log('[Launch] Created team in DB:', team.name);
				}
			}
		} catch (err) {
			console.error('[Launch] Failed to copy pre-workshop data:', err);
			// Don't block the launch if this fails
		}
	}

	const updated = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.id, params.id));
	return json(updated[0]);
};

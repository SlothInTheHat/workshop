import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq, and } from 'drizzle-orm';

function calcCompletion(body: Partial<typeof schema.contributorInputs.$inferInsert>): number {
	const fields = [
		body.goalsAndObjectives,
		body.painPoints,
		body.currentWorkflow,
		body.constraints,
		body.successCriteria,
		body.strategicPillars
	];
	const filled = fields.filter((f) => f && String(f).trim().length > 0).length;
	return Math.round((filled / 6) * 100);
}

// GET /api/workshops/[id]/inputs/[uid] — [uid] is participantId
export const GET: RequestHandler = async ({ params }) => {
	const db = getDb();
	if (!db) return json(null);

	const rows = await db
		.select()
		.from(schema.contributorInputs)
		.where(
			and(
				eq(schema.contributorInputs.workshopId, params.id),
				eq(schema.contributorInputs.participantId, params.uid)
			)
		);

	if (rows.length === 0) return json(null);
	return json(rows[0]);
};

// POST /api/workshops/[id]/inputs/[uid] — create input record for a participant
export const POST: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	if (!db) error(503, 'Database not available');

	const body = (await request.json()) as {
		tenantId?: string;
		goalsAndObjectives?: string;
		painPoints?: string;
		currentWorkflow?: string;
		constraints?: string;
		successCriteria?: string;
		strategicPillars?: string;
	};

	const existing = await db
		.select()
		.from(schema.contributorInputs)
		.where(
			and(
				eq(schema.contributorInputs.workshopId, params.id),
				eq(schema.contributorInputs.participantId, params.uid)
			)
		);

	if (existing.length > 0) error(409, 'Input record already exists — use PATCH to update');

	const workshop = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.id, params.id));
	if (workshop.length === 0) error(404, 'Workshop not found');

	const id = crypto.randomUUID();
	const completion = calcCompletion(body);

	await db.insert(schema.contributorInputs).values({
		id,
		workshopId: params.id,
		participantId: params.uid,
		tenantId: body.tenantId ?? workshop[0].tenantId,
		goalsAndObjectives: body.goalsAndObjectives ?? null,
		painPoints: body.painPoints ?? null,
		currentWorkflow: body.currentWorkflow ?? null,
		constraints: body.constraints ?? null,
		successCriteria: body.successCriteria ?? null,
		strategicPillars: body.strategicPillars ?? null,
		completionPct: completion,
		status: completion === 0 ? 'pending' : completion === 100 ? 'completed' : 'in_progress'
	});

	await db
		.update(schema.preParticipants)
		.set({ status: completion === 100 ? 'completed' : 'in_progress' })
		.where(eq(schema.preParticipants.id, params.uid));

	const row = await db
		.select()
		.from(schema.contributorInputs)
		.where(eq(schema.contributorInputs.id, id));
	return json(row[0], { status: 201 });
};

// PATCH /api/workshops/[id]/inputs/[uid] — auto-save or submit
export const PATCH: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	if (!db) error(503, 'Database not available');

	const body = (await request.json()) as {
		goalsAndObjectives?: string;
		painPoints?: string;
		currentWorkflow?: string;
		constraints?: string;
		successCriteria?: string;
		strategicPillars?: string;
		submit?: boolean;
		actorName?: string;
	};

	const existing = await db
		.select()
		.from(schema.contributorInputs)
		.where(
			and(
				eq(schema.contributorInputs.workshopId, params.id),
				eq(schema.contributorInputs.participantId, params.uid)
			)
		);

	if (existing.length === 0) error(404, 'Input record not found — use POST to create first');

	const current = existing[0];
	const merged = {
		goalsAndObjectives: body.goalsAndObjectives ?? current.goalsAndObjectives,
		painPoints: body.painPoints ?? current.painPoints,
		currentWorkflow: body.currentWorkflow ?? current.currentWorkflow,
		constraints: body.constraints ?? current.constraints,
		successCriteria: body.successCriteria ?? current.successCriteria,
		strategicPillars: body.strategicPillars ?? current.strategicPillars
	};

	const completion = calcCompletion(merged);
	const isSubmit = body.submit === true && completion === 100;

	await db
		.update(schema.contributorInputs)
		.set({
			...merged,
			completionPct: completion,
			status: isSubmit ? 'completed' : completion === 0 ? 'pending' : 'in_progress',
			submittedAt: isSubmit ? new Date() : current.submittedAt
		})
		.where(
			and(
				eq(schema.contributorInputs.workshopId, params.id),
				eq(schema.contributorInputs.participantId, params.uid)
			)
		);

	await db
		.update(schema.preParticipants)
		.set({ status: isSubmit ? 'completed' : 'in_progress' })
		.where(eq(schema.preParticipants.id, params.uid));

	if (isSubmit) {
		const workshop = await db
			.select()
			.from(schema.preWorkshops)
			.where(eq(schema.preWorkshops.id, params.id));
		if (workshop.length > 0) {
			await db.insert(schema.activityLogs).values({
				id: crypto.randomUUID(),
				workshopId: params.id,
				tenantId: workshop[0].tenantId,
				actorName: body.actorName ?? 'Contributor',
				action: 'input_submitted',
				details: `${body.actorName ?? 'A contributor'} submitted their pre-workshop input`,
				createdAt: new Date()
			});
		}
	}

	const updated = await db
		.select()
		.from(schema.contributorInputs)
		.where(
			and(
				eq(schema.contributorInputs.workshopId, params.id),
				eq(schema.contributorInputs.participantId, params.uid)
			)
		);
	return json(updated[0]);
};

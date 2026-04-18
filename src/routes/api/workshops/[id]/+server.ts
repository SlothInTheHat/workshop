import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

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
	}

	const updated = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.id, params.id));
	return json(updated[0]);
};

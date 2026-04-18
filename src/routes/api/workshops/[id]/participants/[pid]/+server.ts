import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

// PATCH /api/workshops/[id]/participants/[pid]
export const PATCH: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	if (!db) error(503, 'Database not available');

	const body = (await request.json()) as {
		name?: string;
		email?: string;
		role?: string;
		status?: string;
	};

	const existing = await db
		.select()
		.from(schema.preParticipants)
		.where(eq(schema.preParticipants.id, params.pid));
	if (existing.length === 0) error(404, 'Participant not found');

	const updates: Partial<typeof schema.preParticipants.$inferInsert> = {};
	if (body.name !== undefined) updates.name = body.name;
	if (body.email !== undefined) updates.email = body.email;
	if (body.role !== undefined) updates.role = body.role;
	if (body.status !== undefined) updates.status = body.status;

	await db.update(schema.preParticipants).set(updates).where(eq(schema.preParticipants.id, params.pid));

	const updated = await db
		.select()
		.from(schema.preParticipants)
		.where(eq(schema.preParticipants.id, params.pid));
	return json(updated[0]);
};

// DELETE /api/workshops/[id]/participants/[pid]
export const DELETE: RequestHandler = async ({ params }) => {
	const db = getDb();
	if (!db) error(503, 'Database not available');

	const existing = await db
		.select()
		.from(schema.preParticipants)
		.where(eq(schema.preParticipants.id, params.pid));
	if (existing.length === 0) error(404, 'Participant not found');

	await db.delete(schema.preParticipants).where(eq(schema.preParticipants.id, params.pid));

	const workshop = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.id, params.id));

	if (workshop.length > 0) {
		await db.insert(schema.activityLogs).values({
			id: crypto.randomUUID(),
			workshopId: params.id,
			tenantId: workshop[0].tenantId,
			actorName: 'Facilitator',
			action: 'participant_removed',
			details: `Removed participant ${existing[0].name}`,
			createdAt: new Date()
		});
	}

	return json({ success: true });
};

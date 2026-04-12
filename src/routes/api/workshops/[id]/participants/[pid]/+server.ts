import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

// PATCH /api/workshops/[id]/participants/[pid]
export const PATCH: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	const body = (await request.json()) as {
		name?: string;
		email?: string;
		role?: string;
		status?: string;
	};

	const existing = await db
		.select()
		.from(schema.participants)
		.where(eq(schema.participants.id, params.pid));
	if (existing.length === 0) error(404, 'Participant not found');

	const updates: Partial<typeof schema.participants.$inferInsert> = {};
	if (body.name !== undefined) updates.name = body.name;
	if (body.email !== undefined) updates.email = body.email;
	if (body.role !== undefined) updates.role = body.role;
	if (body.status !== undefined) updates.status = body.status;

	await db.update(schema.participants).set(updates).where(eq(schema.participants.id, params.pid));

	const updated = await db
		.select()
		.from(schema.participants)
		.where(eq(schema.participants.id, params.pid));
	return json(updated[0]);
};

// DELETE /api/workshops/[id]/participants/[pid]
export const DELETE: RequestHandler = async ({ params }) => {
	const db = getDb();
	const existing = await db
		.select()
		.from(schema.participants)
		.where(eq(schema.participants.id, params.pid));
	if (existing.length === 0) error(404, 'Participant not found');

	await db.delete(schema.participants).where(eq(schema.participants.id, params.pid));

	const workshop = await db
		.select()
		.from(schema.workshops)
		.where(eq(schema.workshops.id, params.id));

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

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

// GET /api/workshops/[id]/participants
export const GET: RequestHandler = async ({ params }) => {
	const db = getDb();
	const rows = await db
		.select()
		.from(schema.participants)
		.where(eq(schema.participants.workshopId, params.id));
	return json(rows);
};

// POST /api/workshops/[id]/participants
export const POST: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	const body = (await request.json()) as {
		name: string;
		email?: string;
		role?: string;
		actorName?: string;
	};

	if (!body.name?.trim()) error(400, 'name is required');

	const workshop = await db
		.select()
		.from(schema.workshops)
		.where(eq(schema.workshops.id, params.id));
	if (workshop.length === 0) error(404, 'Workshop not found');

	const id = crypto.randomUUID();
	await db.insert(schema.participants).values({
		id,
		workshopId: params.id,
		tenantId: workshop[0].tenantId,
		name: body.name.trim(),
		email: body.email?.trim() ?? null,
		role: body.role ?? 'contributor',
		status: 'pending',
		createdAt: new Date()
	});

	await db.insert(schema.activityLogs).values({
		id: crypto.randomUUID(),
		workshopId: params.id,
		tenantId: workshop[0].tenantId,
		actorName: body.actorName ?? 'Facilitator',
		action: 'participant_added',
		details: `Added ${body.name} as ${body.role ?? 'contributor'}`,
		createdAt: new Date()
	});

	const participant = await db
		.select()
		.from(schema.participants)
		.where(eq(schema.participants.id, id));
	return json(participant[0], { status: 201 });
};

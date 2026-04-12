import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

// GET /api/workshops — list all workshops for a tenant
export const GET: RequestHandler = async ({ url }) => {
	const db = getDb();
	const tenantId = url.searchParams.get('tenantId') ?? 'default';

	const rows = await db
		.select()
		.from(schema.workshops)
		.where(eq(schema.workshops.tenantId, tenantId))
		.orderBy(schema.workshops.createdAt);

	// Attach participant counts
	const result = await Promise.all(
		rows.map(async (w) => {
			const pts = await db
				.select()
				.from(schema.participants)
				.where(eq(schema.participants.workshopId, w.id));
			return { ...w, participantCount: pts.length };
		})
	);

	return json(result);
};

// POST /api/workshops — create a new workshop (with participants)
export const POST: RequestHandler = async ({ request }) => {
	const db = getDb();
	const body = (await request.json()) as {
		tenantId?: string;
		title: string;
		focusArea?: string;
		objective?: string;
		dataSensitivity?: string;
		kickoffSummary?: string;
		leadFacilitatorName?: string;
		participants?: Array<{ name: string; email?: string; role: string }>;
	};

	const tenantId = body.tenantId ?? 'default';
	const workshopId = crypto.randomUUID();

	await db.insert(schema.workshops).values({
		id: workshopId,
		tenantId,
		title: body.title,
		focusArea: body.focusArea ?? null,
		objective: body.objective ?? null,
		status: 'pre',
		dataSensitivity: body.dataSensitivity ?? 'internal',
		leadFacilitatorName: body.leadFacilitatorName ?? null,
		kickoffSummary: body.kickoffSummary ?? null,
		createdAt: new Date(),
		updatedAt: new Date()
	});

	// Insert participants
	const participantRows = (body.participants ?? []).map((p) => ({
		id: crypto.randomUUID(),
		workshopId,
		tenantId,
		name: p.name,
		email: p.email ?? null,
		role: p.role,
		status: 'pending' as const,
		createdAt: new Date()
	}));

	if (participantRows.length > 0) {
		await db.insert(schema.participants).values(participantRows);
	}

	// Log activity
	await db.insert(schema.activityLogs).values({
		id: crypto.randomUUID(),
		workshopId,
		tenantId,
		actorName: body.leadFacilitatorName ?? 'Facilitator',
		action: 'workshop_created',
		details: `Workshop "${body.title}" created with ${participantRows.length} participant(s)`,
		createdAt: new Date()
	});

	const workshop = await db
		.select()
		.from(schema.workshops)
		.where(eq(schema.workshops.id, workshopId));

	return json(workshop[0], { status: 201 });
};

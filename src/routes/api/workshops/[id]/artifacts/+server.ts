import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

// GET /api/workshops/[id]/artifacts
export const GET: RequestHandler = async ({ params }) => {
	const db = getDb();
	if (!db) return json([]);

	const rows = await db
		.select()
		.from(schema.artifacts)
		.where(eq(schema.artifacts.workshopId, params.id))
		.orderBy(schema.artifacts.createdAt);
	return json(rows);
};

// POST /api/workshops/[id]/artifacts — store artifact URL (no real upload in Phase 1)
export const POST: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	if (!db) error(503, 'Database not available');

	const body = (await request.json()) as {
		title: string;
		storageUrl: string;
		type?: string;
		visibility?: string;
		uploadedBy: string;
	};

	if (!body.title?.trim()) error(400, 'title is required');
	if (!body.storageUrl?.trim()) error(400, 'storageUrl is required');
	if (!body.uploadedBy?.trim()) error(400, 'uploadedBy is required');

	const workshop = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.id, params.id));
	if (workshop.length === 0) error(404, 'Workshop not found');

	const id = crypto.randomUUID();
	await db.insert(schema.artifacts).values({
		id,
		workshopId: params.id,
		tenantId: workshop[0].tenantId,
		uploadedBy: body.uploadedBy,
		type: body.type ?? 'document',
		title: body.title.trim(),
		storageUrl: body.storageUrl.trim(),
		visibility: body.visibility ?? 'all',
		createdAt: new Date()
	});

	await db.insert(schema.activityLogs).values({
		id: crypto.randomUUID(),
		workshopId: params.id,
		tenantId: workshop[0].tenantId,
		actorName: body.uploadedBy,
		action: 'artifact_uploaded',
		details: `Uploaded artifact: "${body.title}"`,
		createdAt: new Date()
	});

	const artifact = await db
		.select()
		.from(schema.artifacts)
		.where(eq(schema.artifacts.id, id));
	return json(artifact[0], { status: 201 });
};

// DELETE /api/workshops/[id]/artifacts?artifactId=xxx
export const DELETE: RequestHandler = async ({ params, url }) => {
	const db = getDb();
	if (!db) error(503, 'Database not available');

	const artifactId = url.searchParams.get('artifactId');
	if (!artifactId) error(400, 'artifactId query param is required');

	await db.delete(schema.artifacts).where(eq(schema.artifacts.id, artifactId));
	return json({ success: true });
};

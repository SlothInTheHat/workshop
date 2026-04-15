import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

// GET /api/workshops/[id]/inputs — list all contributor inputs for a workshop
export const GET: RequestHandler = async ({ params }) => {
	const db = getDb();
	if (!db) return json([]);

	const rows = await db
		.select()
		.from(schema.contributorInputs)
		.where(eq(schema.contributorInputs.workshopId, params.id));
	return json(rows);
};

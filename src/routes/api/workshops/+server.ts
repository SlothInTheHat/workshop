import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';
import { generateCode } from '$lib/codes';
import { getSession } from '$lib/session';

// GET /api/workshops — list all workshops for a tenant
export const GET: RequestHandler = async ({ url }) => {
	const db = getDb();

	// If no database, return empty array
	if (!db) {
		return json([]);
	}

	const tenantId = url.searchParams.get('tenantId') ?? 'default';

	const rows = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.tenantId, tenantId))
		.orderBy(schema.preWorkshops.createdAt);

	// Attach participant counts
	const result = await Promise.all(
		rows.map(async (w) => {
			const pts = await db
				.select()
				.from(schema.preParticipants)
				.where(eq(schema.preParticipants.workshopId, w.id));
			return { ...w, participantCount: pts.length };
		})
	);

	return json(result);
};

// POST /api/workshops — create a new workshop (with participants)
export const POST: RequestHandler = async ({ request, cookies }) => {
	console.log('[API POST /api/workshops] Handler called');

	const db = getDb();
	console.log('[API POST /api/workshops] getDb() result:', db ? 'Database connected' : 'Database is NULL');

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

	console.log('[API POST /api/workshops] Request body:', { title: body.title, tenantId: body.tenantId });

	const tenantId = body.tenantId ?? 'default';

	// Get codes from session (generated during name entry)
	const session = getSession(cookies);
	const facilitatorCode = session?.facilitatorCode ?? generateCode('FAC');
	const contributorCode = session?.contributorCode ?? generateCode('CON');

	console.log('[API POST /api/workshops] Codes:', { facilitatorCode, contributorCode, fromSession: !!session?.facilitatorCode });

	// If database is available, create workshop in database
	if (db) {
		console.log('[API POST /api/workshops] Database is available, attempting insert');
		try {
			const workshopId = crypto.randomUUID();

			console.log('[API] Inserting workshop into database:', workshopId);

			await db.insert(schema.preWorkshops).values({
				id: workshopId,
				tenantId,
				title: body.title,
				focusArea: body.focusArea ?? null,
				objective: body.objective ?? null,
				status: 'pre',
				dataSensitivity: body.dataSensitivity ?? 'internal',
				leadFacilitatorName: body.leadFacilitatorName ?? null,
				kickoffSummary: body.kickoffSummary ?? null,
				facilitatorCode,
				contributorCode,
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
				await db.insert(schema.preParticipants).values(participantRows);
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
				.from(schema.preWorkshops)
				.where(eq(schema.preWorkshops.id, workshopId));

			console.log('[API POST /api/workshops] SUCCESS! Workshop created:', workshop[0].id);
			return json(workshop[0], { status: 201 });
		} catch (err) {
			console.error('[API POST /api/workshops] ERROR during database insert:', err);
			console.error('[API POST /api/workshops] Error details:', err instanceof Error ? err.message : String(err));
			// Fall through to static code fallback
		}
	} else {
		console.log('[API POST /api/workshops] Database is NULL, using fallback');
	}

	// Fallback to static codes when no database or database error
	const workshopId = 'workshop-1';

	console.log('[API POST /api/workshops] Returning mock workshop (fallback mode)');
	// Return mock workshop object with codes from session or static
	return json({
		id: workshopId,
		tenantId,
		title: body.title,
		focusArea: body.focusArea ?? null,
		objective: body.objective ?? null,
		status: 'pre',
		dataSensitivity: body.dataSensitivity ?? 'internal',
		leadFacilitatorName: body.leadFacilitatorName ?? null,
		kickoffSummary: body.kickoffSummary ?? null,
		facilitatorCode,
		contributorCode,
		createdAt: new Date(),
		updatedAt: new Date()
	}, { status: 201 });
};

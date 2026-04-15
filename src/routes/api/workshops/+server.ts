import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';
import { generateCode } from '$lib/codes';
import { getAccessCodes, getSession } from '$lib/session';

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

	// Get codes from session (generated during name entry)
	const session = getSession(cookies);
	let facilitatorCode: string;
	let contributorCode: string;

	if (session?.facilitatorCode && session?.contributorCode) {
		// Use codes from session (what user already saw)
		facilitatorCode = session.facilitatorCode;
		contributorCode = session.contributorCode;
	} else {
		// Fallback: generate new codes if not in session
		facilitatorCode = generateCode('FAC');
		contributorCode = generateCode('CON');
	}

	// If database is available, create workshop in database
	if (db) {
		try {
			const workshopId = crypto.randomUUID();

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

			return json(workshop[0], { status: 201 });
		} catch (err) {
			console.error('[API] Failed to create workshop in database:', err);
			// Fall through to static code fallback
		}
	}

	// Fallback to static codes when no database or database error
	const workshopId = 'workshop-1';

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

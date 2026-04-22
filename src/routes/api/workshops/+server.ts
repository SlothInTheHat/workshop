import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';
import { generateCode } from '$lib/codes';
import { getSession, setSession } from '$lib/session';
import { sendWorkshopInvite } from '$lib/email';

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

	// If db is null, return 503
	if (!db) {
		console.log('[API POST /api/workshops] Database is NULL, returning 503');
		return json({ error: 'Database unavailable' }, { status: 503 });
	}

	const body = (await request.json()) as {
		title: string;
		client?: string;
		focusArea?: string;
		objective?: string;
		participants?: Array<{ name: string; email: string; role: string }>;
	};

	console.log('[API POST /api/workshops] Request body:', { title: body.title, client: body.client });

	const session = getSession(cookies);

	// Generate codes
	const facilitatorCode = generateCode('FAC');
	const contributorCode = generateCode('CON');

	console.log('[API POST /api/workshops] Generated codes:', { facilitatorCode, contributorCode });

	try {
		// Create workshop ID
		const id = 'pw-' + Date.now();

		console.log('[API POST /api/workshops] Creating workshop with ID:', id);

		// Insert into preWorkshops
		await db.insert(schema.preWorkshops).values({
			id,
			tenantId: 'default',
			title: body.title,
			focusArea: body.focusArea ?? null,
			objective: body.objective ?? null,
			status: 'pre',
			facilitatorCode,
			contributorCode,
			leadFacilitatorName: session?.name ?? 'Facilitator',
			createdAt: new Date(),
			updatedAt: new Date()
		});

		console.log('[API POST /api/workshops] Workshop inserted into database');

		// Insert participants if provided
		if (body.participants && body.participants.length > 0) {
			const participantRows = body.participants.map((p) => ({
				id: crypto.randomUUID(),
				workshopId: id,
				tenantId: 'default',
				name: p.name,
				email: p.email,
				role: p.role,
				status: 'pending' as const,
				createdAt: new Date()
			}));

			await db.insert(schema.preParticipants).values(participantRows);
			console.log('[API POST /api/workshops] Inserted', participantRows.length, 'participants');
		}

		console.log('[API POST /api/workshops] SUCCESS! Workshop created:', id);
		console.log('[API POST /api/workshops] Codes:', { facilitatorCode, contributorCode });

		// Set facilitator session for the creator
		const facilitatorName = session?.name ?? 'Facilitator';
		setSession(cookies, facilitatorName, 'facilitator', id);
		console.log('[API POST /api/workshops] Session created for:', facilitatorName);

		// Send email invites to all participants
		const baseUrl = request.headers.get('origin') ?? 'http://localhost:5173';

		if (body.participants && body.participants.length > 0) {
			for (const participant of body.participants) {
				if (!participant.email) continue;

				const code = participant.role === 'facilitator' ? facilitatorCode : contributorCode;
				const prefix = participant.role === 'facilitator' ? 'f' : 'c';
				const joinLink = `${baseUrl}/${prefix}/${code}`;

				try {
					await sendWorkshopInvite({
						toEmail: participant.email,
						toName: participant.name,
						workshopTitle: body.title,
						facilitatorName: session?.name ?? 'Workshop Organizer',
						joinLink,
						role: participant.role
					});
					console.log('[EMAIL] Sent invite to:', participant.email);
				} catch (err) {
					console.error('[EMAIL] Failed to send to:', participant.email, err);
					// Don't fail the whole request if email fails
				}
			}
		}

		return json({ id, facilitatorCode, contributorCode }, { status: 201 });
	} catch (err) {
		console.error('[API POST /api/workshops] ERROR during database insert:', err);
		console.error('[API POST /api/workshops] Error details:', err instanceof Error ? err.message : String(err));
		return json({ error: 'Failed to create workshop' }, { status: 500 });
	}
};

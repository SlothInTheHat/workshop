import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSession, setSession, getAccessCodes, clearSession } from '$lib/session';
import { getDb, schema } from '$lib/db/index';
import { or, eq, and } from 'drizzle-orm';

async function ensureParticipant(db: NonNullable<ReturnType<typeof getDb>>, workshopId: string, name: string, role: string) {
	try {
		const existing = await db.select().from(schema.preParticipants)
			.where(and(eq(schema.preParticipants.workshopId, workshopId), eq(schema.preParticipants.name, name)));
		if (existing.length === 0) {
			await db.insert(schema.preParticipants).values({
				id: crypto.randomUUID(),
				workshopId,
				tenantId: 'default',
				name,
				role,
				status: 'pending',
				createdAt: new Date(),
			});
		}
	} catch (err) {
		console.warn('[JOIN] Failed to upsert pre_participant:', err);
	}
}

function workshopRedirect(role: 'facilitator' | 'contributor', workshopId: string, status?: string) {
	if (role === 'contributor') {
		if (status === 'live') return `/workshop/${workshopId}/live`;
		if (status === 'completed') return `/workshops/${workshopId}/post/contributor`;
		return `/workshops/${workshopId}/contributor`;
	}
	if (status === 'live') return `/workshop/${workshopId}/live`;
	if (status === 'completed') return `/workshops/${workshopId}/post`;
	return `/workshops/${workshopId}/pre`;
}

export const load: PageServerLoad = async ({ cookies, url }) => {
	const returnTo = url.searchParams.get('return') ?? '/workshops';
	const code = url.searchParams.get('code')?.trim().toUpperCase() ?? '';

	// If user already has an active session for a workshop, bypass the code entry
	const existingSession = getSession(cookies);
	if (existingSession?.workshopId && !code) {
		const db = getDb();
		if (db) {
			try {
				const workshops = await db
					.select()
					.from(schema.preWorkshops)
					.where(eq(schema.preWorkshops.id, existingSession.workshopId))
					.limit(1);
				if (workshops.length > 0) {
					redirect(303, workshopRedirect(existingSession.role, existingSession.workshopId, workshops[0].status));
				}
			} catch {
				// fall through to show join form
			}
		} else {
			redirect(303, workshopRedirect(existingSession.role, existingSession.workshopId));
		}
	}

	// If code is provided in URL, automatically try to join
	if (code) {
		const db = getDb();

		console.log('[JOIN LOAD] Auto-joining with code:', code);

		// Try database first
		if (db) {
			try {
				const workshops = await db
					.select()
					.from(schema.preWorkshops)
					.where(
						or(
							eq(schema.preWorkshops.facilitatorCode, code),
							eq(schema.preWorkshops.contributorCode, code)
						)
					)
					.limit(1);

				if (workshops.length > 0) {
					const workshop = workshops[0];
					let role: 'facilitator' | 'contributor';

					if (workshop.facilitatorCode === code) {
						role = 'facilitator';
					} else {
						role = 'contributor';
					}

					console.log('[JOIN LOAD] Found workshop:', workshop.id, 'Role:', role);

					// Set session with a generic name based on role
					const autoName = role === 'facilitator' ? 'Facilitator' : 'Contributor';
					setSession(cookies, autoName, role, workshop.id);

					// Redirect based on role
					if (role === 'contributor') {
						redirect(303, `/workshops/${workshop.id}/contributor`);
					} else {
						const status = workshop.status;
						if (status === 'pre' || status === 'draft') {
							redirect(303, `/workshops/${workshop.id}/pre`);
						} else if (status === 'live') {
							redirect(303, `/workshop/${workshop.id}/live`);
						} else if (status === 'completed') {
							redirect(303, `/workshops/${workshop.id}/post`);
						} else {
							redirect(303, `/workshops/${workshop.id}/pre`);
						}
					}
				}
			} catch (err) {
				console.error('[JOIN LOAD] Database error:', err);
			}
		}

		// Try static codes
		const staticCodes = getAccessCodes();
		if (code === staticCodes.facilitator || code === staticCodes.contributor) {
			const role = code === staticCodes.facilitator ? 'facilitator' : 'contributor';
			const autoName = role === 'facilitator' ? 'Facilitator' : 'Contributor';
			const workshopId = 'workshop-1';

			setSession(cookies, autoName, role, workshopId);

			if (role === 'contributor') {
				redirect(303, `/workshops/${workshopId}/contributor`);
			} else {
				redirect(303, `/workshops/${workshopId}/pre`);
			}
		}
	}

	return { returnTo, prefillCode: code, existingSession: getSession(cookies) };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = (data.get('name') as string | null)?.trim() ?? '';
		const code = (data.get('code') as string | null)?.trim().toUpperCase() ?? '';

		if (!name) return fail(400, { error: 'Name is required', name, code });
		if (!code) return fail(400, { error: 'Access code is required', name, code });

		// Bypass code: grants facilitator access to the default workshop
		if (code === 'BYPASS') {
			setSession(cookies, name, 'facilitator', 'workshop-1');
			redirect(303, '/workshops/workshop-1/pre');
		}

		const db = getDb();

		console.log('[JOIN] Attempting to join with code:', code, 'Database available:', !!db);

		// If database exists, query for workshop
		if (db) {
			try {
				const workshops = await db
					.select()
					.from(schema.preWorkshops)
					.where(
						or(
							eq(schema.preWorkshops.facilitatorCode, code),
							eq(schema.preWorkshops.contributorCode, code)
						)
					)
					.limit(1);

				console.log('[JOIN] Database query result:', workshops.length, 'workshops found');

				if (workshops.length > 0) {
					const workshop = workshops[0];
					let role: 'facilitator' | 'contributor';

					if (workshop.facilitatorCode === code) {
						role = 'facilitator';
					} else {
						role = 'contributor';
					}

					console.log('[JOIN] Found workshop:', workshop.id, 'Role:', role);

					// Set session with workshopId
					setSession(cookies, name, role, workshop.id);

					// Ensure the user appears in pre_participants for dashboard lookup
					await ensureParticipant(db, workshop.id, name, role);

					// Route contributors based on workshop status
					if (role === 'contributor') {
						if (workshop.status === 'live') redirect(303, `/workshop/${workshop.id}/live`);
						if (workshop.status === 'completed') redirect(303, `/workshops/${workshop.id}/post/contributor`);
						redirect(303, `/workshops/${workshop.id}/contributor`);
					}

					// Facilitators route based on workshop status
					const status = workshop.status;

					if (status === 'pre' || status === 'draft') {
						redirect(303, `/workshops/${workshop.id}/pre`);
					} else if (status === 'live') {
						redirect(303, `/workshop/${workshop.id}/live`);
					} else if (status === 'completed') {
						redirect(303, `/workshops/${workshop.id}/post`);
					} else {
						// Default fallback to pre
						redirect(303, `/workshops/${workshop.id}/pre`);
					}
				}
				// If no workshop found in database, fall through to static code check
			} catch (err) {
				console.error('[JOIN] Database query error:', err);
				// Fall through to static codes
			}
		}

		// Fallback to static access codes (either no database or no matching workshop)
		console.log('[JOIN] Checking static codes');
		const staticCodes = getAccessCodes();
		let role: 'facilitator' | 'contributor';

		if (code === staticCodes.facilitator) {
			role = 'facilitator';
		} else if (code === staticCodes.contributor) {
			role = 'contributor';
		} else {
			console.log('[JOIN] Invalid code:', code);
			return fail(400, { error: 'Invalid code', name, code });
		}

		// Use default workshop ID
		const workshopId = 'workshop-1';
		setSession(cookies, name, role, workshopId);

		console.log('[JOIN] Using static code, redirecting to:', role === 'contributor' ? `/workshops/${workshopId}/contributor` : `/workshops/${workshopId}/pre`);

		// Redirect based on role for static codes
		if (role === 'contributor') {
			redirect(303, `/workshops/${workshopId}/contributor`);
		} else {
			redirect(303, `/workshops/${workshopId}/pre`);
		}
	}
};

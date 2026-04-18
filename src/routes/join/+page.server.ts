import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSession, setSession, getAccessCodes, clearSession } from '$lib/session';
import { getDb, schema } from '$lib/db/index';
import { or, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ cookies, url }) => {
	// Clear any existing session so we always start fresh
	clearSession(cookies);
	const returnTo = url.searchParams.get('return') ?? '/workshops';
	return { returnTo };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = (data.get('name') as string | null)?.trim() ?? '';
		const code = (data.get('code') as string | null)?.trim().toUpperCase() ?? '';
		const returnTo = (data.get('returnTo') as string | null) ?? '/workshops';

		if (!name) return fail(400, { error: 'Name is required', name, code });
		if (!code) return fail(400, { error: 'Access code is required', name, code });

		const db = getDb();

		console.log('[JOIN] Attempting to join with code:', code, 'Database available:', !!db);

		// If database is available, query for workshop with matching code
		if (db) {
			try {
				// First, let's see ALL workshops in the database
				const allWorkshops = await db.select().from(schema.preWorkshops);
				console.log('[JOIN] Total workshops in database:', allWorkshops.length);
				if (allWorkshops.length > 0) {
					console.log('[JOIN] Workshop codes in DB:', allWorkshops.map(w => ({ fac: w.facilitatorCode, con: w.contributorCode })));
				}

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
					console.log('[JOIN] Workshop codes:', {
						facilitatorCode: workshops[0].facilitatorCode,
						contributorCode: workshops[0].contributorCode,
						inputCode: code
					});
				}

				if (workshops.length > 0) {
					// Found workshop in database
					const workshop = workshops[0];
					let role: 'facilitator' | 'contributor';

					if (workshop.facilitatorCode === code) {
						role = 'facilitator';
					} else {
						role = 'contributor';
					}

					// Set session with workshopId
					setSession(cookies, name, role, workshop.id);

					// Contributors always go to the contributor input form
					if (role === 'contributor') {
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
		const staticCodes = getAccessCodes();
		let role: 'facilitator' | 'contributor';

		if (code === staticCodes.facilitator) {
			role = 'facilitator';
		} else if (code === staticCodes.contributor) {
			role = 'contributor';
		} else {
			return fail(400, { error: 'Invalid access code. Check with your facilitator.', name, code });
		}

		// Use default workshop ID
		const workshopId = 'workshop-1';
		setSession(cookies, name, role, workshopId);

		// Redirect based on role for static codes
		if (role === 'contributor') {
			redirect(303, `/workshops/${workshopId}/contributor`);
		} else {
			redirect(303, `/workshops/${workshopId}/pre`);
		}
	}
};

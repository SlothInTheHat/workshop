import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { setSession, getAccessCodes } from '$lib/session';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const code = params.code.toUpperCase();

	// Validate code exists in database or static codes
	const db = getDb();
	if (db) {
		const workshops = await db
			.select()
			.from(schema.preWorkshops)
			.where(eq(schema.preWorkshops.facilitatorCode, code))
			.limit(1);

		if (workshops.length > 0) {
			return { code, valid: true };
		}
	}

	// Check static code
	const staticCodes = getAccessCodes();
	if (code === staticCodes.facilitator) {
		return { code, valid: true };
	}

	// Invalid code - redirect to join page with error
	redirect(303, '/join');
};

export const actions: Actions = {
	default: async ({ request, cookies, params }) => {
		const data = await request.formData();
		const name = (data.get('name') as string | null)?.trim() ?? '';
		const code = params.code.toUpperCase();

		if (!name) return fail(400, { error: 'Name is required' });

		const db = getDb();

		console.log('[FACILITATOR JOIN] Code:', code, 'Name:', name);

		// Try database first
		if (db) {
			const workshops = await db
				.select()
				.from(schema.preWorkshops)
				.where(eq(schema.preWorkshops.facilitatorCode, code))
				.limit(1);

			if (workshops.length > 0) {
				const workshop = workshops[0];
				console.log('[FACILITATOR JOIN] Found workshop:', workshop.id);

				setSession(cookies, name, 'facilitator', workshop.id);

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

		// Try static code
		const staticCodes = getAccessCodes();
		if (code === staticCodes.facilitator) {
			const workshopId = 'workshop-1';
			setSession(cookies, name, 'facilitator', workshopId);
			redirect(303, `/workshops/${workshopId}/pre`);
		}

		return fail(400, { error: 'Invalid facilitator code' });
	}
};

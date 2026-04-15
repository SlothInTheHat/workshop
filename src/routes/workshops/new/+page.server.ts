import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getSession, setSession, getAccessCodes, clearSession } from '$lib/session';
import { generateCode } from '$lib/codes';

export const load: PageServerLoad = async ({ cookies }) => {
	// Always clear session and show name entry form
	clearSession(cookies);
	const codes = getAccessCodes();
	return { session: null, needsAuth: true, codes };
};

export const actions: Actions = {
	createSession: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = (data.get('name') as string | null)?.trim() ?? '';

		if (!name) {
			return fail(400, { error: 'Name is required', name });
		}

		// Generate codes immediately
		const facilitatorCode = generateCode('FAC');
		const contributorCode = generateCode('CON');

		// Auto-create facilitator session with codes stored
		setSession(cookies, name, 'facilitator', undefined, facilitatorCode, contributorCode);

		// Return codes to show on the page
		return { success: true, facilitatorCode, contributorCode, name };
	}
};

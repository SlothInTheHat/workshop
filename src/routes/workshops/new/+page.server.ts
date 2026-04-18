import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getSession, setSession } from '$lib/session';
import { generateCode } from '$lib/codes';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = getSession(cookies);

	// If already authenticated as a facilitator, use existing session
	if (session?.role === 'facilitator') {
		return { session, needsAuth: false };
	}

	// Not authenticated — will show name entry form
	return { session: null, needsAuth: true };
};

export const actions: Actions = {
	createSession: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = (data.get('name') as string | null)?.trim() ?? '';

		if (!name) {
			return fail(400, { error: 'Name is required', name });
		}

		// Generate per-workshop codes upfront so they can be shown before DB creation
		const facilitatorCode = generateCode('FAC');
		const contributorCode = generateCode('CON');

		setSession(cookies, name, 'facilitator', undefined, facilitatorCode, contributorCode);

		return { success: true, facilitatorCode, contributorCode, name };
	}
};

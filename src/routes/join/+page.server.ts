import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSession, setSession, getAccessCodes } from '$lib/session';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const session = getSession(cookies);
	const returnTo = url.searchParams.get('return') ?? '/workshops';

	// Already logged in — redirect
	if (session) {
		redirect(303, returnTo);
	}

	return { returnTo };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = (data.get('name') as string | null)?.trim() ?? '';
		const code = (data.get('code') as string | null)?.trim() ?? '';
		const returnTo = (data.get('returnTo') as string | null) ?? '/workshops';

		if (!name) return fail(400, { error: 'Name is required', name, code });
		if (!code) return fail(400, { error: 'Access code is required', name, code });

		const codes = getAccessCodes();

		if (code.toUpperCase() === codes.facilitator.toUpperCase()) {
			setSession(cookies, name, 'facilitator');
			redirect(303, returnTo);
		} else if (code.toUpperCase() === codes.contributor.toUpperCase()) {
			setSession(cookies, name, 'contributor');
			redirect(303, returnTo);
		} else {
			return fail(400, { error: 'Invalid access code. Check with your facilitator.', name, code });
		}
	}
};

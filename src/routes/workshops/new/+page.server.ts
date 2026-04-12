import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = getSession(cookies);
	if (!session) redirect(303, '/join?return=/workshops/new');
	if (session.role !== 'facilitator') redirect(303, '/workshops');

	return { session };
};

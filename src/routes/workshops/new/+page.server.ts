import type { PageServerLoad } from './$types';
import { getSession, clearSession } from '$lib/session';

export const load: PageServerLoad = async ({ cookies }) => {
	clearSession(cookies);
	const session = getSession(cookies);
	return { session };
};

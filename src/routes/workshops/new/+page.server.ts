import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = getSession(cookies);
	return { session };
};

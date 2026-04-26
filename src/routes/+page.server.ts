import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  // Don't load dummy workshop data on homepage
  return { workshop: null, teams: [], participants: [], useCaseCount: 0 };
};

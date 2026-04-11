import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const res = await fetch('/api/workshop/workshop-1');
    if (!res.ok) return { workshop: null, teams: [], participants: [], useCaseCount: 0 };
    const data = await res.json();
    return data;
  } catch {
    return { workshop: null, teams: [], participants: [], useCaseCount: 0 };
  }
};

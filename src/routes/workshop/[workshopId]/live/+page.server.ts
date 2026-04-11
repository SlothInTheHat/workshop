import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const { workshopId } = params;

  const [overviewRes, usecasesRes] = await Promise.all([
    fetch(`/api/workshop/${workshopId}`),
    fetch(`/api/workshop/${workshopId}/usecases`),
  ]);

  const overview = overviewRes.ok ? await overviewRes.json() : { workshop: null, teams: [], participants: [] };
  const usecases = usecasesRes.ok ? await usecasesRes.json() : [];

  // Treat the first participant as the current user (auth is bypassed)
  const me = overview.participants?.[0] ?? null;

  return {
    workshop: overview.workshop,
    teams: overview.teams ?? [],
    participants: overview.participants ?? [],
    usecases,
    me,
  };
};

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const { workshopId } = params;

  const [overviewRes, usecasesRes, insightsRes] = await Promise.all([
    fetch(`/api/workshop/${workshopId}`),
    fetch(`/api/workshop/${workshopId}/usecases`),
    fetch(`/api/workshop/${workshopId}/insights?sortBy=upvotes`),
  ]);

  const overview = overviewRes.ok ? await overviewRes.json() : { workshop: null, participants: [] };
  const usecases = usecasesRes.ok ? await usecasesRes.json() : [];
  const insights = insightsRes.ok ? await insightsRes.json() : [];

  const me = overview.participants?.[0] ?? null;

  return {
    workshop: overview.workshop,
    participants: overview.participants ?? [],
    usecases,
    insights,
    me,
  };
};

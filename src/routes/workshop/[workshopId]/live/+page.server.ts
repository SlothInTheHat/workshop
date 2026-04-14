import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { participants } from '$lib/workshop/store.js';

export const load: PageServerLoad = async ({ fetch, params, locals }) => {
  if (!locals.user) redirect(302, '/auth/login');

  const { workshopId } = params;

  const [overviewRes, usecasesRes] = await Promise.all([
    fetch(`/api/workshop/${workshopId}`),
    fetch(`/api/workshop/${workshopId}/usecases`),
  ]);

  const overview = overviewRes.ok ? await overviewRes.json() : { workshop: null, teams: [], participants: [] };
  const usecases = usecasesRes.ok ? await usecasesRes.json() : [];

  // Find participant matching the logged-in user
  const me = participants.get(locals.user.id) ?? null;
  const needsTeamSelection = !me || me.workshopId !== workshopId || !me.teamId;

  return {
    workshop: overview.workshop,
    teams: overview.teams ?? [],
    participants: overview.participants ?? [],
    usecases,
    me,
    needsTeamSelection,
    currentUser: {
      id: locals.user.id,
      name: locals.user.name,
      initials: locals.user.initials,
      color: locals.user.color,
      role: locals.user.role,
    },
  };
};

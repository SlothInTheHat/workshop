import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';
import { participants } from '$lib/workshop/store.js';

export const load: PageServerLoad = async ({ fetch, params, cookies }) => {
  const session = getSession(cookies);
  if (!session) redirect(303, `/join?return=/workshop/${params.workshopId}/live`);

  const { workshopId } = params;

  const [overviewRes, usecasesRes] = await Promise.all([
    fetch(`/api/workshop/${workshopId}`),
    fetch(`/api/workshop/${workshopId}/usecases`),
  ]);

  const overview = overviewRes.ok ? await overviewRes.json() : { workshop: null, teams: [], participants: [] };
  const usecases = usecasesRes.ok ? await usecasesRes.json() : [];

  // Find participant matching the session name
  const me = Array.from(participants.values()).find(p =>
    p.workshopId === workshopId && p.name === session.name
  ) ?? null;
  const needsTeamSelection = !me || !me.teamId;

  // Generate initials and color from name
  const initials = session.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400', 'bg-yellow-400', 'bg-red-400'];
  const color = colors[session.name.length % colors.length];

  return {
    workshop: overview.workshop,
    teams: overview.teams ?? [],
    participants: overview.participants ?? [],
    usecases,
    me,
    needsTeamSelection,
    currentUser: {
      id: me?.id ?? crypto.randomUUID(),
      name: session.name,
      initials,
      color,
      role: session.role ?? 'contributor',
    },
  };
};

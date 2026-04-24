import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';
import { participants } from '$lib/workshop/store.js';
import { getDb } from '$lib/db/index.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

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

  const db = getDb();
  let me = null;

  // Check in-memory store first (for seed data)
  me = Array.from(participants.values()).find(p =>
    p.workshopId === workshopId && p.name === session?.name
  ) ?? null;

  // If not found, check database
  if (!me && db && session?.name) {
    try {
      const dbParts = await db.select()
        .from(schema.preParticipants)
        .where(eq(schema.preParticipants.workshopId, workshopId));
      const found = dbParts.find(p => p.name === session.name);
      if (found) {
        const foundInitials = found.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        const foundColors = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400', 'bg-yellow-400', 'bg-red-400'];
        me = {
          id: found.id,
          name: found.name,
          workshopId,
          teamId: undefined,
          presence: 'remote' as const,
          role: found.role,
          initials: foundInitials,
          color: foundColors[found.name.length % foundColors.length],
        };
      }
    } catch (err) {
      console.warn('[Live] DB participant lookup failed:', err);
    }
  }

  const needsTeamSelection = !me?.teamId;

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

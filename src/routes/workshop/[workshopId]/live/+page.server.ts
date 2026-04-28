import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '$lib/session';
import { participants } from '$lib/workshop/store.js';
import { getDb } from '$lib/db/index.js';
import * as schema from '$lib/db/schema.js';
import { and, eq } from 'drizzle-orm';

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

  // Check DB live_participants first (persistent across serverless instances)
  if (db && session?.name) {
    try {
      const rows = await db.select().from(schema.liveParticipants)
        .where(and(
          eq(schema.liveParticipants.workshopId, workshopId),
          eq(schema.liveParticipants.name, session.name)
        ));
      if (rows.length > 0) {
        const p = rows[0];
        me = {
          id: p.id,
          name: p.name,
          workshopId,
          teamId: p.teamId ?? undefined,
          presence: 'remote' as const,
          role: p.role,
          initials: p.initials,
          color: p.color,
        };
      }
    } catch (err) {
      console.warn('[Live] DB live_participants lookup failed:', err);
    }
  }

  // Fall back to in-memory store (seeded data / no DB)
  if (!me) {
    me = Array.from(participants.values()).find(p =>
      p.workshopId === workshopId && p.name === session?.name
    ) ?? null;
  }

  const initials = session.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400', 'bg-yellow-400', 'bg-red-400'];
  const color = colors[session.name.length % colors.length];

  return {
    workshop: overview.workshop,
    teams: overview.teams ?? [],
    participants: overview.participants ?? [],
    usecases,
    me,
    needsTeamSelection: !me?.teamId,
    currentUser: {
      id: me?.id ?? crypto.randomUUID(),
      name: session.name,
      initials,
      color,
      role: session.role ?? 'contributor',
    },
  };
};

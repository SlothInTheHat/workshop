import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { workshops, teams, participants, createParticipant } from '$lib/workshop/store.js';
import { getDb } from '$lib/db/index.js';
import * as schema from '$lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request }) => {
  const { workshopId } = params;
  const db = getDb();

  const body = await request.json().catch(() => null);
  if (!body) throw error(400, 'Invalid request body');

  const { teamId, name, initials, color, role } = body;
  if (!teamId || !name) throw error(400, 'teamId and name are required');

  const derivedInitials = initials ?? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const derivedColor = color ?? 'bg-blue-400';
  const derivedRole = role ?? 'contributor';

  // DB-backed path (Vercel / production)
  if (db) {
    try {
      // Check if participant already exists
      const existing = await db.select().from(schema.liveParticipants)
        .where(and(
          eq(schema.liveParticipants.workshopId, workshopId),
          eq(schema.liveParticipants.name, name)
        ));

      let participant;

      if (existing.length > 0) {
        // Update team assignment
        const [updated] = await db.update(schema.liveParticipants)
          .set({ teamId })
          .where(eq(schema.liveParticipants.id, existing[0].id))
          .returning();
        participant = updated;
      } else {
        const id = 'p-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        const [created] = await db.insert(schema.liveParticipants).values({
          id,
          workshopId,
          name,
          role: derivedRole,
          initials: derivedInitials,
          color: derivedColor,
          teamId,
        }).returning();
        participant = created;
      }

      // memberIds are derived from live_participants — no update needed on breakout_teams

      return json(participant, { status: 201 });
    } catch (err) {
      console.error('[JOIN] DB error:', err);
      // Fall through to in-memory
    }
  }

  // In-memory fallback
  const workshopExists = workshops.has(workshopId);
  if (!workshopExists) throw error(404, 'Workshop not found');

  const existing = Array.from(participants.values()).find(
    p => p.workshopId === workshopId && p.name === name
  );

  if (existing) {
    if (existing.teamId !== teamId) {
      participants.set(existing.id, { ...existing, teamId });
      for (const [, t] of teams) {
        if (t.workshopId === workshopId && t.memberIds.includes(existing.id)) {
          teams.set(t.id, { ...t, memberIds: t.memberIds.filter(id => id !== existing.id) });
        }
      }
      const team = teams.get(teamId);
      if (team) teams.set(teamId, { ...team, memberIds: [...team.memberIds.filter(id => id !== existing.id), existing.id] });
    }
    return json(participants.get(existing.id));
  }

  const participantId = 'p-' + Date.now() + '-' + Math.random().toString(36).substring(7);
  const participant = createParticipant({
    id: participantId,
    workshopId,
    name,
    role: derivedRole,
    initials: derivedInitials,
    color: derivedColor,
    teamId,
  });

  return json(participant, { status: 201 });
};

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/db/index.js';
import { workshops, participants } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params }) => {
  const { workshopId, participantId } = params;
  const db = getDb();

  if (db) {
    // Mark this participant as having voted in live_participants
    const rows = await db.select().from(schema.liveParticipants)
      .where(and(
        eq(schema.liveParticipants.id, participantId),
        eq(schema.liveParticipants.workshopId, workshopId),
      ));

    if (rows.length === 0) throw error(404, 'Participant not found');

    await db.update(schema.liveParticipants)
      .set({ hasVoted: true })
      .where(eq(schema.liveParticipants.id, participantId));

    console.log(`[VOTING] Participant ${participantId} finished voting.`);
    return json({ success: true });
  }

  // In-memory fallback
  const workshop = workshops.get(workshopId);
  if (!workshop) throw error(404, 'Workshop not found');
  if (!workshop.finishedVoting) workshop.finishedVoting = new Set<string>();
  workshop.finishedVoting.add(participantId);
  return json({ success: true });
};

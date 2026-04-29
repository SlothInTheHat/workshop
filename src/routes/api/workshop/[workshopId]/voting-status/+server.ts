import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/db/index.js';
import { workshops, getWorkshopParticipants } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
  const { workshopId } = params;
  const db = getDb();

  if (db) {
    const allParticipants = await db.select().from(schema.liveParticipants)
      .where(eq(schema.liveParticipants.workshopId, workshopId));

    const finishedParticipantIds = allParticipants
      .filter(p => p.hasVoted)
      .map(p => p.id);

    const finishedCount = finishedParticipantIds.length;
    const totalParticipants = allParticipants.length;
    const allFinished = totalParticipants > 0 && finishedCount >= totalParticipants;

    return json({ finishedCount, totalParticipants, allFinished, finishedParticipantIds });
  }

  // In-memory fallback
  const workshop = workshops.get(workshopId);
  if (!workshop) throw error(404, 'Workshop not found');

  const allParticipants = getWorkshopParticipants(workshopId);
  const finishedVoting = workshop.finishedVoting || new Set<string>();
  const finishedCount = finishedVoting.size;
  const totalParticipants = allParticipants.length;
  const allFinished = totalParticipants > 0 && finishedCount >= totalParticipants;

  return json({
    finishedCount,
    totalParticipants,
    allFinished,
    finishedParticipantIds: Array.from(finishedVoting),
  });
};

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
    const workshopRows = await db.select().from(schema.workshops)
      .where(eq(schema.workshops.id, workshopId));

    if (workshopRows.length === 0) throw error(404, 'Workshop not found');
    const workshop = workshopRows[0];

    const allParticipants = await db.select().from(schema.liveParticipants)
      .where(eq(schema.liveParticipants.workshopId, workshopId));

    const finishedVoting = Array.isArray((workshop as any).finishedVoting) ? (workshop as any).finishedVoting : [];
    const finishedCount = finishedVoting.length;
    const totalParticipants = allParticipants.length;
    const allFinished = finishedCount >= totalParticipants && totalParticipants > 0;

    return json({ finishedCount, totalParticipants, allFinished, finishedParticipantIds: finishedVoting });
  }

  // In-memory fallback
  const workshop = workshops.get(workshopId);
  if (!workshop) throw error(404, 'Workshop not found');

  const allParticipants = getWorkshopParticipants(workshopId);
  const finishedVoting = workshop.finishedVoting || new Set<string>();
  const finishedCount = finishedVoting.size;
  const totalParticipants = allParticipants.length;
  const allFinished = finishedCount >= totalParticipants && totalParticipants > 0;

  return json({
    finishedCount,
    totalParticipants,
    allFinished,
    finishedParticipantIds: Array.from(finishedVoting),
  });
};

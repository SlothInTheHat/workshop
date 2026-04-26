import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { workshops, getWorkshopParticipants } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
  const { workshopId } = params;

  if (isDatabaseEnabled && db) {
    // Fetch workshop from db to get finishedVoting array
    const workshop = await db.query.workshops.findFirst({
      where: eq(schema.workshops.id, workshopId),
    });
    if (!workshop) throw error(404, 'Workshop not found');

    // Fetch participants from db
    const allParticipants = await db.query.participants.findMany({
      where: eq(schema.participants.workshopId, workshopId),
    });

    const finishedVoting = Array.isArray(workshop.finishedVoting) ? workshop.finishedVoting : [];
    const finishedCount = finishedVoting.length;
    // Count all participants (contributors + facilitators)
    const totalParticipants = allParticipants.length;
    // Everyone must finish voting before moving to Round 2
    const allFinished = finishedCount >= totalParticipants && totalParticipants > 0;

    return json({
      finishedCount,
      totalParticipants,
      allFinished,
      finishedParticipantIds: finishedVoting,
    });
  } else {
    // In-memory logic
    const workshop = workshops.get(workshopId);
    if (!workshop) throw error(404, 'Workshop not found');

    const allParticipants = getWorkshopParticipants(workshopId);

    const finishedVoting = workshop.finishedVoting || new Set<string>();
    const finishedCount = finishedVoting.size;
    // Count all participants (contributors + facilitators)
    const totalParticipants = allParticipants.length;
    // Everyone must finish voting before moving to Round 2
    const allFinished = finishedCount >= totalParticipants && totalParticipants > 0;

    return json({
      finishedCount,
      totalParticipants,
      allFinished,
      finishedParticipantIds: Array.from(finishedVoting),
    });
  }
};

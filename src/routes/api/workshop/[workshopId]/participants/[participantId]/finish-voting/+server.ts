import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { workshops, participants } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params }) => {
  const { workshopId, participantId } = params;

  if (isDatabaseEnabled && db) {
    // Fetch workshop from db
    const workshop = await db.query.workshops.findFirst({
      where: eq(schema.workshops.id, workshopId),
    });
    if (!workshop) throw error(404, 'Workshop not found');

    // Verify participant exists and belongs to this workshop
    const participant = await db.query.participants.findFirst({
      where: eq(schema.participants.id, participantId),
    });
    if (!participant) throw error(404, 'Participant not found');
    if (participant.workshopId !== workshopId) throw error(400, 'Participant not in this workshop');

    // Get current finishedVoting array
    const finishedVoting = Array.isArray(workshop.finishedVoting) ? workshop.finishedVoting : [];

    // Add participantId if not already there
    if (!finishedVoting.includes(participantId)) {
      finishedVoting.push(participantId);

      // Update workshop in db
      await db
        .update(schema.workshops)
        .set({ finishedVoting })
        .where(eq(schema.workshops.id, workshopId));

      console.log(`[VOTING] Participant ${participantId} finished voting. Total: ${finishedVoting.length}`);
    }

    return json({ success: true });
  } else {
    // In-memory logic
    const workshop = workshops.get(workshopId);
    if (!workshop) throw error(404, 'Workshop not found');

    const participant = participants.get(participantId);
    if (!participant) throw error(404, 'Participant not found');
    if (participant.workshopId !== workshopId) throw error(400, 'Participant not in this workshop');

    // Initialize finishedVoting set if it doesn't exist
    if (!workshop.finishedVoting) {
      workshop.finishedVoting = new Set<string>();
    }

    // Add participant to finishedVoting set
    workshop.finishedVoting.add(participantId);

    console.log(`[VOTING] Participant ${participantId} finished voting. Total: ${workshop.finishedVoting.size}`);

    return json({ success: true });
  }
};

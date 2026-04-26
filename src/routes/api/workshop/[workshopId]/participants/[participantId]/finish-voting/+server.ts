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

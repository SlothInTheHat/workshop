import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { useCases, upvoteUseCase } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json().catch(() => null);
  if (!body?.participantId || typeof body.participantId !== 'string') {
    throw error(400, 'participantId is required');
  }

  if (isDatabaseEnabled && db) {
    const uc = await db.query.useCases.findFirst({
      where: eq(schema.useCases.id, params.usecaseId),
    });

    if (!uc || uc.workshopId !== params.workshopId) throw error(404, 'Use case not found');

    // Check if already voted
    const upvotedBy = uc.upvotedBy as string[];
    if (upvotedBy.includes(body.participantId)) {
      // Already voted, return current state
      return json({ id: uc.id, upvotes: uc.upvotes });
    }

    // Add upvote
    const newUpvotedBy = [...upvotedBy, body.participantId];
    const newUpvotes = uc.upvotes + 1;

    const [updated] = await db
      .update(schema.useCases)
      .set({
        upvotes: newUpvotes,
        upvotedBy: newUpvotedBy,
      })
      .where(eq(schema.useCases.id, params.usecaseId))
      .returning();

    // Update corresponding insight upvotes
    await db
      .update(schema.insights)
      .set({ upvotes: newUpvotes })
      .where(eq(schema.insights.useCaseId, params.usecaseId));

    return json({ id: updated.id, upvotes: updated.upvotes });
  } else {
    const uc = useCases.get(params.usecaseId);
    if (!uc || uc.workshopId !== params.workshopId) throw error(404, 'Use case not found');

    const updated = upvoteUseCase(params.usecaseId, body.participantId);
    if (!updated) throw error(404, 'Use case not found');

    return json({ id: updated.id, upvotes: updated.upvotes });
  }
};

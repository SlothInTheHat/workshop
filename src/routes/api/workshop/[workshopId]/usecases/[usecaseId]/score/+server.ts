import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomUUID } from 'crypto';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { useCases, addScore } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json().catch(() => null);
  if (!body) throw error(400, 'Request body is required');

  const { scoredBy, impact, feasibility, alignment, executiveWeight, notes } = body;

  if (!scoredBy || typeof scoredBy !== 'string') {
    throw error(400, 'scoredBy is required and must be a string');
  }

  // Validate all scores are numbers between 1-10
  const scores = { impact, feasibility, alignment, executiveWeight };
  for (const [key, value] of Object.entries(scores)) {
    if (typeof value !== 'number' || value < 1 || value > 10) {
      throw error(400, `${key} must be a number between 1 and 10`);
    }
  }

  if (notes !== undefined && typeof notes !== 'string') {
    throw error(400, 'notes must be a string if provided');
  }

  if (isDatabaseEnabled && db) {
    const uc = await db.query.useCases.findFirst({
      where: eq(schema.useCases.id, params.usecaseId),
    });

    if (!uc || uc.workshopId !== params.workshopId) throw error(404, 'Use case not found');

    // Check if this user has already scored this use case
    const existingScore = await db.query.scores.findFirst({
      where: and(eq(schema.scores.useCaseId, params.usecaseId), eq(schema.scores.scoredBy, scoredBy)),
    });

    if (existingScore) {
      // Update existing score
      const [updated] = await db
        .update(schema.scores)
        .set({
          impact,
          feasibility,
          alignment,
          executiveWeight,
          notes,
        })
        .where(eq(schema.scores.id, existingScore.id))
        .returning();

      return json(updated);
    } else {
      // Create new score
      const [newScore] = await db
        .insert(schema.scores)
        .values({
          id: randomUUID(),
          workshopId: params.workshopId,
          useCaseId: params.usecaseId,
          scoredBy,
          impact,
          feasibility,
          alignment,
          executiveWeight,
          notes,
        })
        .returning();

      return json(newScore);
    }
  } else {
    const uc = useCases.get(params.usecaseId);
    if (!uc || uc.workshopId !== params.workshopId) throw error(404, 'Use case not found');

    const score = addScore({
      workshopId: params.workshopId,
      useCaseId: params.usecaseId,
      scoredBy,
      impact,
      feasibility,
      alignment,
      executiveWeight,
      notes,
    });

    return json(score);
  }
};

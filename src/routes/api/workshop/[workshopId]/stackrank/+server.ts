import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { workshops, calculateStackRank } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RankedUseCase } from '$lib/workshop/types.js';

export const GET: RequestHandler = async ({ params }) => {
  if (isDatabaseEnabled && db) {
    const workshop = await db.query.workshops.findFirst({
      where: eq(schema.workshops.id, params.workshopId),
    });
    if (!workshop) throw error(404, 'Workshop not found');

    // Get all use cases for the workshop
    const useCases = await db.query.useCases.findMany({
      where: eq(schema.useCases.workshopId, params.workshopId),
    });

    // Get all scores for the workshop
    const allScores = await db.query.scores.findMany({
      where: eq(schema.scores.workshopId, params.workshopId),
    });

    // Calculate rankings
    const ranked: RankedUseCase[] = useCases.map((uc) => {
      const ucScores = allScores.filter((s) => s.useCaseId === uc.id);

      let impactAvg = 0;
      let feasibilityAvg = 0;
      let alignmentAvg = 0;
      let executiveWeightAvg = 0;
      const scoreCount = ucScores.length;

      if (scoreCount > 0) {
        impactAvg = ucScores.reduce((sum, s) => sum + s.impact, 0) / scoreCount;
        feasibilityAvg = ucScores.reduce((sum, s) => sum + s.feasibility, 0) / scoreCount;
        alignmentAvg = ucScores.reduce((sum, s) => sum + s.alignment, 0) / scoreCount;
        executiveWeightAvg = ucScores.reduce((sum, s) => sum + s.executiveWeight, 0) / scoreCount;
      }

      const finalScore = impactAvg * feasibilityAvg + 2 * uc.upvotes + executiveWeightAvg;

      return {
        ...uc,
        finalScore,
        impactAvg,
        feasibilityAvg,
        alignmentAvg,
        executiveWeightAvg,
        scoreCount,
        createdAt: uc.createdAt.toISOString(),
      } as RankedUseCase;
    });

    // Sort by finalScore descending
    ranked.sort((a, b) => b.finalScore - a.finalScore);

    return json(ranked);
  } else {
    const workshop = workshops.get(params.workshopId);
    if (!workshop) throw error(404, 'Workshop not found');

    const ranked = calculateStackRank(params.workshopId);

    return json(ranked);
  }
};

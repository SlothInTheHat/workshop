import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { workshops, getWorkshopInsights } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq, and, desc, asc } from 'drizzle-orm';

// GET /api/workshop/:workshopId/insights?teamId=...&sortBy=upvotes
export const GET: RequestHandler = async ({ params, url }) => {
  const teamId = url.searchParams.get('teamId');
  const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';

  if (isDatabaseEnabled && db) {
    const workshop = await db.query.workshops.findFirst({
      where: eq(schema.workshops.id, params.workshopId),
    });
    if (!workshop) throw error(404, 'Workshop not found');

    let query = db.query.insights.findMany({
      where: teamId
        ? and(eq(schema.insights.workshopId, params.workshopId), eq(schema.insights.teamId, teamId))
        : eq(schema.insights.workshopId, params.workshopId),
    });

    let result = await query;

    // Sort results
    if (sortBy === 'upvotes') {
      result = result.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      result = result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return json(result);
  } else {
    if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');

    let result = getWorkshopInsights(params.workshopId);

    if (teamId) result = result.filter((i) => i.teamId === teamId);

    if (sortBy === 'upvotes') {
      result = result.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      result = result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return json(result);
  }
};

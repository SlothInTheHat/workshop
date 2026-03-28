import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { workshops, getWorkshopInsights } from '$lib/workshop/store.js';

// GET /api/workshop/:workshopId/insights?teamId=...
export const GET: RequestHandler = async ({ params, url }) => {
  if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');

  let result = getWorkshopInsights(params.workshopId);

  const teamId = url.searchParams.get('teamId');
  if (teamId) result = result.filter((i) => i.teamId === teamId);

  const sortBy = url.searchParams.get('sortBy') ?? 'createdAt';
  if (sortBy === 'upvotes') {
    result = result.sort((a, b) => b.upvotes - a.upvotes);
  } else {
    result = result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return json(result);
};

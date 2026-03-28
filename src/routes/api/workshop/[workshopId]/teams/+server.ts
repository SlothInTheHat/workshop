import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { workshops, getWorkshopTeams, createTeam } from '$lib/workshop/store.js';

export const GET: RequestHandler = async ({ params }) => {
  if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');
  return json(getWorkshopTeams(params.workshopId));
};

export const POST: RequestHandler = async ({ params, request }) => {
  if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');

  const body = await request.json().catch(() => null);
  if (!body?.name || typeof body.name !== 'string') {
    throw error(400, 'name is required');
  }

  const memberIds: string[] = Array.isArray(body.memberIds) ? body.memberIds : [];
  const team = createTeam(params.workshopId, body.name.trim(), memberIds);
  return json(team, { status: 201 });
};

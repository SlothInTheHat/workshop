import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { teams, updateTeam, deleteTeam } from '$lib/workshop/store.js';

function assertTeamBelongsToWorkshop(teamId: string, workshopId: string) {
  const team = teams.get(teamId);
  if (!team) throw error(404, 'Team not found');
  if (team.workshopId !== workshopId) throw error(404, 'Team not found');
  return team;
}

export const GET: RequestHandler = async ({ params }) => {
  const team = assertTeamBelongsToWorkshop(params.teamId, params.workshopId);
  return json(team);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  assertTeamBelongsToWorkshop(params.teamId, params.workshopId);

  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.name === 'string') patch.name = body.name.trim();
  if (Array.isArray(body.memberIds)) patch.memberIds = body.memberIds;

  if (Object.keys(patch).length === 0) throw error(400, 'No valid fields to update');

  const updated = updateTeam(params.teamId, patch);
  return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
  assertTeamBelongsToWorkshop(params.teamId, params.workshopId);
  deleteTeam(params.teamId);
  return new Response(null, { status: 204 });
};

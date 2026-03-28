import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { teams, participants, addTeamMember, removeTeamMember } from '$lib/workshop/store.js';

function assertTeamBelongsToWorkshop(teamId: string, workshopId: string) {
  const team = teams.get(teamId);
  if (!team) throw error(404, 'Team not found');
  if (team.workshopId !== workshopId) throw error(404, 'Team not found');
  return team;
}

// POST /api/workshop/:workshopId/teams/:teamId/members  — add a participant
export const POST: RequestHandler = async ({ params, request }) => {
  assertTeamBelongsToWorkshop(params.teamId, params.workshopId);

  const body = await request.json().catch(() => null);
  if (!body?.participantId || typeof body.participantId !== 'string') {
    throw error(400, 'participantId is required');
  }

  const participant = participants.get(body.participantId);
  if (!participant || participant.workshopId !== params.workshopId) {
    throw error(404, 'Participant not found in this workshop');
  }

  const updated = addTeamMember(params.teamId, body.participantId);
  return json(updated);
};

// DELETE /api/workshop/:workshopId/teams/:teamId/members/:participantId
export const DELETE: RequestHandler = async ({ params, url }) => {
  assertTeamBelongsToWorkshop(params.teamId, params.workshopId);

  const participantId = url.searchParams.get('participantId');
  if (!participantId) throw error(400, 'participantId query param is required');

  const updated = removeTeamMember(params.teamId, participantId);
  if (!updated) throw error(404, 'Team not found');
  return json(updated);
};

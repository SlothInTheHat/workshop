import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { workshops, teams, participants, createParticipant } from '$lib/workshop/store.js';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const { workshopId } = params;
  if (!workshops.has(workshopId)) throw error(404, 'Workshop not found');
  if (!locals.user) throw error(401, 'Not authenticated');
  const user = locals.user;

  const body = await request.json().catch(() => null);
  const teamId = body?.teamId as string | undefined;

  if (!teamId || !teams.has(teamId)) throw error(400, 'Valid teamId is required');

  const team = teams.get(teamId)!;
  if (team.workshopId !== workshopId) throw error(400, 'Team does not belong to this workshop');

  // If already joined, just return the existing participant
  const existing = participants.get(user.id);
  if (existing && existing.workshopId === workshopId) {
    // Update team if changed
    if (existing.teamId !== teamId) {
      participants.set(user.id, { ...existing, teamId });
      // Update old team memberIds
      for (const [, t] of teams) {
        if (t.workshopId === workshopId && t.memberIds.includes(user.id)) {
          teams.set(t.id, { ...t, memberIds: t.memberIds.filter(id => id !== user.id) });
        }
      }
      // Add to new team
      teams.set(teamId, { ...team, memberIds: [...team.memberIds.filter(id => id !== user.id), user.id] });
    }
    return json(participants.get(user.id));
  }

  const participant = createParticipant({
    id: user.id,
    workshopId,
    name: user.name,
    role: user.role,
    initials: user.initials,
    color: user.color,
    teamId,
  });

  return json(participant, { status: 201 });
};

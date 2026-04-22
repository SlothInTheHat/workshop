import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { workshops, teams, participants, createParticipant } from '$lib/workshop/store.js';
import { getDb } from '$lib/db/index.js';

export const POST: RequestHandler = async ({ params, request }) => {
  const { workshopId } = params;
  const db = getDb();
  const workshopExists = workshops.has(workshopId) || (db ? true : false);

  if (!workshopExists) throw error(404, 'Workshop not found');

  const body = await request.json().catch(() => null);
  if (!body) throw error(400, 'Invalid request body');

  const { teamId, name, initials, color, role } = body;

  const teamExists = teams.has(teamId) || (db ? true : false);
  if (!teamId || !teamExists) throw error(400, 'Valid teamId is required');
  if (!name) throw error(400, 'Name is required');

  const team = teams.get(teamId);
  if (team && team.workshopId !== workshopId) throw error(400, 'Team does not belong to this workshop');

  // Check if participant already exists by name
  const existing = Array.from(participants.values()).find(
    p => p.workshopId === workshopId && p.name === name
  );

  if (existing) {
    console.log('[JOIN] Participant exists, updating team:', existing.id, 'to', teamId);
    // Update team if changed
    if (existing.teamId !== teamId) {
      participants.set(existing.id, { ...existing, teamId });
      // Update old team memberIds
      for (const [, t] of teams) {
        if (t.workshopId === workshopId && t.memberIds.includes(existing.id)) {
          teams.set(t.id, { ...t, memberIds: t.memberIds.filter(id => id !== existing.id) });
        }
      }
      // Add to new team
      if (team) {
        teams.set(teamId, { ...team, memberIds: [...team.memberIds.filter(id => id !== existing.id), existing.id] });
      }
    }
    return json(participants.get(existing.id));
  }

  // Create new participant
  const participantId = 'p-' + Date.now() + '-' + Math.random().toString(36).substring(7);
  console.log('[JOIN] Creating new participant:', participantId, name, 'for team', teamId);

  const participant = createParticipant({
    id: participantId,
    workshopId,
    name,
    role: role ?? 'contributor',
    initials: initials ?? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    color: color ?? 'bg-blue-400',
    teamId,
  });

  console.log('[JOIN] Participant created:', participant);
  return json(participant, { status: 201 });
};

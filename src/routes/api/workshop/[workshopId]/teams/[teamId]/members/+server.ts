import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { teams, participants, addTeamMember, removeTeamMember } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

function assertTeamBelongsToWorkshop(teamId: string, workshopId: string) {
  const team = teams.get(teamId);
  if (!team) throw error(404, 'Team not found');
  if (team.workshopId !== workshopId) throw error(404, 'Team not found');
  return team;
}

// POST /api/workshop/:workshopId/teams/:teamId/members  — add a participant
export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json().catch(() => null);
  if (!body?.participantId || typeof body.participantId !== 'string') {
    throw error(400, 'participantId is required');
  }

  if (isDatabaseEnabled && db) {
    const team = await db.query.teams.findFirst({
      where: eq(schema.teams.id, params.teamId),
    });
    if (!team || team.workshopId !== params.workshopId) throw error(404, 'Team not found');

    const participant = await db.query.participants.findFirst({
      where: eq(schema.participants.id, body.participantId),
    });
    if (!participant || participant.workshopId !== params.workshopId) {
      throw error(404, 'Participant not found in this workshop');
    }

    // Check if already a member
    const memberIds = team.memberIds as string[];
    if (memberIds.includes(body.participantId)) {
      return json(team);
    }

    const newMemberIds = [...memberIds, body.participantId];
    const [updated] = await db
      .update(schema.teams)
      .set({ memberIds: newMemberIds })
      .where(eq(schema.teams.id, params.teamId))
      .returning();

    // Update participant's teamId
    await db
      .update(schema.participants)
      .set({ teamId: params.teamId })
      .where(eq(schema.participants.id, body.participantId));

    return json(updated);
  } else {
    assertTeamBelongsToWorkshop(params.teamId, params.workshopId);

    const participant = participants.get(body.participantId);
    if (!participant || participant.workshopId !== params.workshopId) {
      throw error(404, 'Participant not found in this workshop');
    }

    const updated = addTeamMember(params.teamId, body.participantId);
    return json(updated);
  }
};

// DELETE /api/workshop/:workshopId/teams/:teamId/members?participantId=xxx
export const DELETE: RequestHandler = async ({ params, url }) => {
  const participantId = url.searchParams.get('participantId');
  if (!participantId) throw error(400, 'participantId query param is required');

  if (isDatabaseEnabled && db) {
    const team = await db.query.teams.findFirst({
      where: eq(schema.teams.id, params.teamId),
    });
    if (!team || team.workshopId !== params.workshopId) throw error(404, 'Team not found');

    const memberIds = team.memberIds as string[];
    const newMemberIds = memberIds.filter((id) => id !== participantId);

    const [updated] = await db
      .update(schema.teams)
      .set({ memberIds: newMemberIds })
      .where(eq(schema.teams.id, params.teamId))
      .returning();

    // Clear participant's teamId
    await db
      .update(schema.participants)
      .set({ teamId: null })
      .where(eq(schema.participants.id, participantId));

    return json(updated);
  } else {
    assertTeamBelongsToWorkshop(params.teamId, params.workshopId);

    const updated = removeTeamMember(params.teamId, participantId);
    if (!updated) throw error(404, 'Team not found');
    return json(updated);
  }
};

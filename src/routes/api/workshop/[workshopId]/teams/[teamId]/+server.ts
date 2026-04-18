import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { teams, updateTeam, deleteTeam } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

function assertTeamBelongsToWorkshop(teamId: string, workshopId: string) {
  const team = teams.get(teamId);
  if (!team) throw error(404, 'Team not found');
  if (team.workshopId !== workshopId) throw error(404, 'Team not found');
  return team;
}

export const GET: RequestHandler = async ({ params }) => {
  if (isDatabaseEnabled && db) {
    const team = await db.query.teams.findFirst({
      where: eq(schema.teams.id, params.teamId),
    });
    if (!team || team.workshopId !== params.workshopId) throw error(404, 'Team not found');
    return json(team);
  } else {
    const team = assertTeamBelongsToWorkshop(params.teamId, params.workshopId);
    return json(team);
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  const body = await request.json().catch(() => ({}));

  if (isDatabaseEnabled && db) {
    const existing = await db.query.teams.findFirst({
      where: eq(schema.teams.id, params.teamId),
    });
    if (!existing || existing.workshopId !== params.workshopId) throw error(404, 'Team not found');

    const patch: Record<string, unknown> = {};
    if (typeof body.name === 'string') patch.name = body.name.trim();
    if (Array.isArray(body.memberIds)) patch.memberIds = body.memberIds;

    if (Object.keys(patch).length === 0) throw error(400, 'No valid fields to update');

    const [updated] = await db
      .update(schema.teams)
      .set(patch)
      .where(eq(schema.teams.id, params.teamId))
      .returning();

    // If memberIds changed, update participants
    if (patch.memberIds) {
      const newMemberIds = patch.memberIds as string[];
      for (const participantId of newMemberIds) {
        await db
          .update(schema.participants)
          .set({ teamId: params.teamId })
          .where(eq(schema.participants.id, participantId));
      }
    }

    return json(updated);
  } else {
    assertTeamBelongsToWorkshop(params.teamId, params.workshopId);

    const patch: Record<string, unknown> = {};
    if (typeof body.name === 'string') patch.name = body.name.trim();
    if (Array.isArray(body.memberIds)) patch.memberIds = body.memberIds;

    if (Object.keys(patch).length === 0) throw error(400, 'No valid fields to update');

    const updated = updateTeam(params.teamId, patch);
    return json(updated);
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  if (isDatabaseEnabled && db) {
    const team = await db.query.teams.findFirst({
      where: eq(schema.teams.id, params.teamId),
    });
    if (!team || team.workshopId !== params.workshopId) throw error(404, 'Team not found');

    // Unassign participants from this team
    const memberIds = team.memberIds as string[];
    for (const participantId of memberIds) {
      await db
        .update(schema.participants)
        .set({ teamId: null })
        .where(eq(schema.participants.id, participantId));
    }

    await db.delete(schema.teams).where(eq(schema.teams.id, params.teamId));

    return new Response(null, { status: 204 });
  } else {
    assertTeamBelongsToWorkshop(params.teamId, params.workshopId);
    deleteTeam(params.teamId);
    return new Response(null, { status: 204 });
  }
};

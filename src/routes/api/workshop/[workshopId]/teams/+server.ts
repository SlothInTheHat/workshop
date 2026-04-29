import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomUUID } from 'crypto';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { workshops, getWorkshopTeams, createTeam } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
  if (isDatabaseEnabled && db) {
    const workshop = await db.query.workshops.findFirst({
      where: eq(schema.workshops.id, params.workshopId),
    });
    if (!workshop) throw error(404, 'Workshop not found');

    const teams = await db.select().from(schema.breakoutTeams).where(eq(schema.breakoutTeams.workshopId, params.workshopId));

    return json(teams);
  } else {
    if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');
    return json(getWorkshopTeams(params.workshopId));
  }
};

export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json().catch(() => null);
  if (!body?.name || typeof body.name !== 'string') {
    throw error(400, 'name is required');
  }

  const memberIds: string[] = Array.isArray(body.memberIds) ? body.memberIds : [];

  if (isDatabaseEnabled && db) {
    const workshop = await db.query.workshops.findFirst({
      where: eq(schema.workshops.id, params.workshopId),
    });
    if (!workshop) throw error(404, 'Workshop not found');

    const [team] = await db
      .insert(schema.breakoutTeams)
      .values({
        id: randomUUID(),
        workshopId: params.workshopId,
        name: body.name.trim(),
        memberIds,
      })
      .returning();

    // Update participants with team assignment
    for (const participantId of memberIds) {
      await db
        .update(schema.liveParticipants)
        .set({ teamId: team.id })
        .where(eq(schema.liveParticipants.id, participantId));
    }

    return json(team, { status: 201 });
  } else {
    if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');
    const team = createTeam(params.workshopId, body.name.trim(), memberIds);
    return json(team, { status: 201 });
  }
};

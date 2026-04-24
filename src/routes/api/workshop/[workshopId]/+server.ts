import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import {
  workshops,
  getWorkshopTeams,
  getWorkshopParticipants,
  getWorkshopUseCases,
} from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq, count } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
  if (isDatabaseEnabled && db) {
    const workshop = await db.query.workshops.findFirst({
      where: eq(schema.workshops.id, params.workshopId),
    });

    if (workshop) {
      const workshopTeams = await db.query.teams.findMany({
        where: eq(schema.teams.workshopId, params.workshopId),
      });

      const workshopParticipants = await db.query.participants.findMany({
        where: eq(schema.participants.workshopId, params.workshopId),
      });

      const useCaseCountResult = await db
        .select({ count: count() })
        .from(schema.useCases)
        .where(eq(schema.useCases.workshopId, params.workshopId));

      const useCaseCount = useCaseCountResult[0].count;

      return json({ workshop, teams: workshopTeams, participants: workshopParticipants, useCaseCount });
    }
    // Workshop not in DB — fall through to in-memory store
  }

  // In-memory store (seeded data or no DB)
  const workshop = workshops.get(params.workshopId);
  if (!workshop) throw error(404, 'Workshop not found');

  const workshopTeams = getWorkshopTeams(params.workshopId);
  const workshopParticipants = getWorkshopParticipants(params.workshopId);
  const useCaseCount = getWorkshopUseCases(params.workshopId).length;

  return json({ workshop, teams: workshopTeams, participants: workshopParticipants, useCaseCount });
};

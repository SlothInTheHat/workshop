import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomUUID } from 'crypto';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { workshops, teams, participants, getWorkshopUseCases, createUseCase } from '$lib/workshop/store.js';
import type { RatingLevel, Visibility } from '$lib/workshop/types.js';
import * as schema from '$lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

const VALID_RATINGS: RatingLevel[] = ['High', 'Medium', 'Low'];
const VALID_VISIBILITY: Visibility[] = ['Internal', 'Restricted', 'Cross-Silo'];

// GET /api/workshop/:workshopId/usecases?teamId=...
export const GET: RequestHandler = async ({ params, url }) => {
  const teamId = url.searchParams.get('teamId') ?? undefined;

  if (isDatabaseEnabled && db) {
    // Check workshop exists
    const workshop = await db.query.workshops.findFirst({
      where: eq(schema.workshops.id, params.workshopId),
    });
    if (!workshop) throw error(404, 'Workshop not found');

    // Query use cases
    const useCases = teamId
      ? await db.query.useCases.findMany({
          where: and(eq(schema.useCases.workshopId, params.workshopId), eq(schema.useCases.teamId, teamId)),
        })
      : await db.query.useCases.findMany({
          where: eq(schema.useCases.workshopId, params.workshopId),
        });

    return json(useCases);
  } else {
    if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');
    return json(getWorkshopUseCases(params.workshopId, teamId));
  }
};

// POST /api/workshop/:workshopId/usecases
export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json().catch(() => null);
  if (!body) throw error(400, 'Invalid JSON body');

  const { title, summary, value, viability, visibility, teamId, participantId, position, collaborators } = body;

  if (!title || typeof title !== 'string') throw error(400, 'title is required');
  if (!summary || typeof summary !== 'string') throw error(400, 'summary is required');
  if (!VALID_RATINGS.includes(value)) throw error(400, 'value must be High, Medium, or Low');
  if (!VALID_RATINGS.includes(viability)) throw error(400, 'viability must be High, Medium, or Low');
  if (!VALID_VISIBILITY.includes(visibility)) throw error(400, 'visibility must be Internal, Restricted, or Cross-Silo');

  if (isDatabaseEnabled && db) {
    // Validate workshop, team, and participant exist
    const workshop = await db.query.workshops.findFirst({
      where: eq(schema.workshops.id, params.workshopId),
    });
    if (!workshop) throw error(404, 'Workshop not found');

    const team = await db.query.teams.findFirst({
      where: eq(schema.teams.id, teamId),
    });
    if (!team || team.workshopId !== params.workshopId) throw error(400, 'teamId is invalid for this workshop');

    const participant = await db.query.participants.findFirst({
      where: eq(schema.participants.id, participantId),
    });
    if (!participant || participant.workshopId !== params.workshopId) {
      throw error(400, 'participantId is invalid for this workshop');
    }

    const useCaseId = randomUUID();
    const insightId = randomUUID();

    // Insert use case
    const [useCase] = await db
      .insert(schema.useCases)
      .values({
        id: useCaseId,
        workshopId: params.workshopId,
        teamId,
        participantId,
        title: title.trim(),
        summary: summary.trim(),
        value,
        viability,
        visibility,
        addedBy: participant.name,
        upvotes: 0,
        upvotedBy: [],
        comments: 0,
        collaborators: Array.isArray(collaborators) ? collaborators : [participant.name],
        position: position && typeof position.x === 'number' ? position : { x: Math.floor(Math.random() * 600), y: Math.floor(Math.random() * 400) },
      })
      .returning();

    // Insert corresponding insight
    const [insight] = await db
      .insert(schema.insights)
      .values({
        id: insightId,
        workshopId: params.workshopId,
        useCaseId,
        teamId,
        title: title.trim(),
        summary: summary.trim(),
        value,
        viability,
        visibility,
        addedBy: participant.name,
        upvotes: 0,
        tags: [value, viability, visibility],
      })
      .returning();

    return json({ useCase, insight }, { status: 201 });
  } else {
    if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');

    const team = teams.get(teamId);
    if (!team || team.workshopId !== params.workshopId) throw error(400, 'teamId is invalid for this workshop');

    const participant = participants.get(participantId);
    if (!participant || participant.workshopId !== params.workshopId) {
      throw error(400, 'participantId is invalid for this workshop');
    }

    const result = createUseCase({
      workshopId: params.workshopId,
      teamId,
      title: title.trim(),
      summary: summary.trim(),
      value,
      viability,
      visibility,
      addedBy: participant.name,
      participantId,
      position: position && typeof position.x === 'number' ? position : undefined,
      collaborators: Array.isArray(collaborators) ? collaborators : undefined,
    });

    return json(result, { status: 201 });
  }
};

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomUUID } from 'crypto';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { workshops, teams, participants, getWorkshopUseCases, createUseCase } from '$lib/workshop/store.js';
import type { RatingLevel } from '$lib/workshop/types.js';
import * as schema from '$lib/db/schema.js';
import { eq, and } from 'drizzle-orm';

const VALID_RATINGS: RatingLevel[] = ['High', 'Medium', 'Low'];

// DB rows have positionX/positionY; frontend expects position: {x, y}
function toFrontend(uc: Record<string, unknown>) {
  const { positionX, positionY, ...rest } = uc as any;
  return { ...rest, position: { x: positionX ?? 0, y: positionY ?? 0 } };
}

// GET /api/workshop/:workshopId/usecases?teamId=...
export const GET: RequestHandler = async ({ params, url }) => {
  const teamId = url.searchParams.get('teamId') ?? undefined;

  if (isDatabaseEnabled && db) {
    const useCases = teamId
      ? await db.select().from(schema.useCases)
          .where(and(eq(schema.useCases.workshopId, params.workshopId), eq(schema.useCases.teamId, teamId)))
      : await db.select().from(schema.useCases)
          .where(eq(schema.useCases.workshopId, params.workshopId));
    return json(useCases.map(toFrontend));
  } else {
    if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');
    return json(getWorkshopUseCases(params.workshopId, teamId));
  }
};

// POST /api/workshop/:workshopId/usecases
export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json().catch(() => null);
  if (!body) throw error(400, 'Invalid JSON body');

  const {
    title, summary, value, viability,
    teamId, participantId, position, collaborators, context,
    pillarTags, problemStatement, solutionOverview, businessUnits,
    timeline, costs, legalCompliance
  } = body;

  if (!title || typeof title !== 'string') throw error(400, 'title is required');
  if (!summary || typeof summary !== 'string') throw error(400, 'summary is required');
  if (!VALID_RATINGS.includes(value)) throw error(400, 'value must be High, Medium, or Low');
  if (!VALID_RATINGS.includes(viability)) throw error(400, 'viability must be High, Medium, or Low');

  if (isDatabaseEnabled && db) {
    try {
    // Look up team from breakout_teams
    const teamRows = await db.select().from(schema.breakoutTeams)
      .where(and(eq(schema.breakoutTeams.id, teamId), eq(schema.breakoutTeams.workshopId, params.workshopId)));
    console.log('[UC POST] team lookup:', teamRows.length, 'rows for teamId:', teamId);
    if (teamRows.length === 0) throw error(400, 'teamId is invalid for this workshop');

    // Look up participant from live_participants
    const participantRows = await db.select().from(schema.liveParticipants)
      .where(and(eq(schema.liveParticipants.id, participantId), eq(schema.liveParticipants.workshopId, params.workshopId)));
    console.log('[UC POST] participant lookup:', participantRows.length, 'rows for participantId:', participantId);
    if (participantRows.length === 0) throw error(400, 'participantId is invalid for this workshop');

    const participant = participantRows[0];
    const useCaseId = randomUUID();
    const insightId = randomUUID();
    const pos = position && typeof position.x === 'number' ? position : { x: Math.floor(Math.random() * 600), y: Math.floor(Math.random() * 400) };

    const [useCase] = await db.insert(schema.useCases).values({
      id: useCaseId,
      workshopId: params.workshopId,
      teamId,
      participantId,
      title: title.trim(),
      summary: summary.trim(),
      context: context ?? '',
      value,
      viability,
      addedBy: participant.name,
      upvotes: 0,
      upvotedBy: [],
      collaborators: Array.isArray(collaborators) ? collaborators : [participant.name],
      positionX: pos.x,
      positionY: pos.y,
      insightId,
      pillarTags: Array.isArray(pillarTags) ? pillarTags : [],
      problemStatement: typeof problemStatement === 'string' ? problemStatement : null,
      solutionOverview: typeof solutionOverview === 'string' ? solutionOverview : null,
      businessUnits: Array.isArray(businessUnits) ? businessUnits : [],
      timeline: typeof timeline === 'string' ? timeline : null,
      costs: typeof costs === 'string' ? costs : null,
      legalCompliance: typeof legalCompliance === 'string' ? legalCompliance : null,
    }).returning();

    const [insight] = await db.insert(schema.insights).values({
      id: insightId,
      workshopId: params.workshopId,
      useCaseId,
      teamId,
      title: title.trim(),
      summary: summary.trim(),
      value,
      viability,
      addedBy: participant.name,
      upvotes: 0,
      tags: [value, viability],
    }).returning();

    return json({ useCase: toFrontend(useCase), insight }, { status: 201 });
    } catch (err: any) {
      const cause = err?.cause?.message ?? err?.cause ?? '';
      console.error('[UC POST] DB error:', err);
      throw error(500, `Use case creation failed: ${err instanceof Error ? err.message : String(err)} | cause: ${cause}`);
    }
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
      addedBy: participant.name,
      participantId,
      position: position && typeof position.x === 'number' ? position : undefined,
      collaborators: Array.isArray(collaborators) ? collaborators : undefined,
      context: context ?? '',
      pillarTags: Array.isArray(pillarTags) ? pillarTags : undefined,
      problemStatement: typeof problemStatement === 'string' ? problemStatement : undefined,
      solutionOverview: typeof solutionOverview === 'string' ? solutionOverview : undefined,
      businessUnits: Array.isArray(businessUnits) ? businessUnits : undefined,
      timeline: typeof timeline === 'string' ? timeline : undefined,
      costs: typeof costs === 'string' ? costs : undefined,
      legalCompliance: typeof legalCompliance === 'string' ? legalCompliance : undefined,
    });

    return json(result, { status: 201 });
  }
};

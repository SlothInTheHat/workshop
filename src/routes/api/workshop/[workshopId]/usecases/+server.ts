import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { workshops, teams, participants, getWorkshopUseCases, createUseCase } from '$lib/workshop/store.js';
import type { RatingLevel, Visibility } from '$lib/workshop/types.js';

const VALID_RATINGS: RatingLevel[] = ['High', 'Medium', 'Low'];
const VALID_VISIBILITY: Visibility[] = ['Internal', 'Restricted', 'Cross-Silo'];

// GET /api/workshop/:workshopId/usecases?teamId=...
export const GET: RequestHandler = async ({ params, url }) => {
  if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');
  const teamId = url.searchParams.get('teamId') ?? undefined;
  return json(getWorkshopUseCases(params.workshopId, teamId));
};

// POST /api/workshop/:workshopId/usecases
export const POST: RequestHandler = async ({ params, request }) => {
  if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');

  const body = await request.json().catch(() => null);
  if (!body) throw error(400, 'Invalid JSON body');

  const { title, summary, value, viability, visibility, teamId, participantId, position, collaborators } = body;

  if (!title || typeof title !== 'string') throw error(400, 'title is required');
  if (!summary || typeof summary !== 'string') throw error(400, 'summary is required');
  if (!VALID_RATINGS.includes(value)) throw error(400, 'value must be High, Medium, or Low');
  if (!VALID_RATINGS.includes(viability)) throw error(400, 'viability must be High, Medium, or Low');
  if (!VALID_VISIBILITY.includes(visibility)) throw error(400, 'visibility must be Internal, Restricted, or Cross-Silo');

  const team = teams.get(teamId);
  if (!team || team.workshopId !== params.workshopId) throw error(400, 'teamId is invalid for this workshop');

  const participant = participants.get(participantId);
  if (!participant || participant.workshopId !== params.workshopId) throw error(400, 'participantId is invalid for this workshop');

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
};

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { useCases, updateUseCase, deleteUseCase } from '$lib/workshop/store.js';
import type { RatingLevel, Visibility } from '$lib/workshop/types.js';

const VALID_RATINGS: RatingLevel[] = ['High', 'Medium', 'Low'];
const VALID_VISIBILITY: Visibility[] = ['Internal', 'Restricted', 'Cross-Silo'];

function assertUseCaseBelongsToWorkshop(useCaseId: string, workshopId: string) {
  const uc = useCases.get(useCaseId);
  if (!uc) throw error(404, 'Use case not found');
  if (uc.workshopId !== workshopId) throw error(404, 'Use case not found');
  return uc;
}

export const GET: RequestHandler = async ({ params }) => {
  const uc = assertUseCaseBelongsToWorkshop(params.usecaseId, params.workshopId);
  return json(uc);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  assertUseCaseBelongsToWorkshop(params.usecaseId, params.workshopId);

  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (typeof body.title === 'string') patch.title = body.title.trim();
  if (typeof body.summary === 'string') patch.summary = body.summary.trim();
  if (VALID_RATINGS.includes(body.value)) patch.value = body.value;
  if (VALID_RATINGS.includes(body.viability)) patch.viability = body.viability;
  if (VALID_VISIBILITY.includes(body.visibility)) patch.visibility = body.visibility;
  if (body.position && typeof body.position.x === 'number') patch.position = body.position;
  if (typeof body.clusterId === 'number') patch.clusterId = body.clusterId;
  if (Array.isArray(body.collaborators)) patch.collaborators = body.collaborators;

  if (Object.keys(patch).length === 0) throw error(400, 'No valid fields to update');

  const updated = updateUseCase(params.usecaseId, patch as Parameters<typeof updateUseCase>[1]);
  return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
  assertUseCaseBelongsToWorkshop(params.usecaseId, params.workshopId);
  deleteUseCase(params.usecaseId);
  return new Response(null, { status: 204 });
};

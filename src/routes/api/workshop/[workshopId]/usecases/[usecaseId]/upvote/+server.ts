import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { useCases, upvoteUseCase } from '$lib/workshop/store.js';

export const POST: RequestHandler = async ({ params, request }) => {
  const uc = useCases.get(params.usecaseId);
  if (!uc || uc.workshopId !== params.workshopId) throw error(404, 'Use case not found');

  const body = await request.json().catch(() => null);
  if (!body?.participantId || typeof body.participantId !== 'string') {
    throw error(400, 'participantId is required');
  }

  const updated = upvoteUseCase(params.usecaseId, body.participantId);
  if (!updated) throw error(404, 'Use case not found');

  return json({ id: updated.id, upvotes: updated.upvotes });
};

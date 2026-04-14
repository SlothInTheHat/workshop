import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { useCases, participants, getComments, createComment } from '$lib/workshop/store.js';

export const GET: RequestHandler = async ({ params }) => {
  const { usecaseId } = params;
  if (!useCases.has(usecaseId)) throw error(404, 'Use case not found');
  return json(getComments(usecaseId));
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
  const { workshopId, usecaseId } = params;
  if (!useCases.has(usecaseId)) throw error(404, 'Use case not found');
  if (!locals.user) throw error(401, 'Not authenticated');

  const body = await request.json().catch(() => null);
  const content = (body?.content as string)?.trim();
  if (!content) throw error(400, 'content is required');

  // Get participant info for author details
  const participant = participants.get(locals.user.id);
  const authorName = participant?.name ?? locals.user.name;
  const authorInitials = participant?.initials ?? locals.user.initials;
  const authorColor = participant?.color ?? locals.user.color;

  const comment = createComment({
    useCaseId: usecaseId,
    participantId: locals.user.id,
    authorName,
    authorInitials,
    authorColor,
    content,
    workshopId,
  });

  return json(comment, { status: 201 });
};

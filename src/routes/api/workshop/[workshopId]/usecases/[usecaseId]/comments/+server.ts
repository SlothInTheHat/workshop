import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { useCases, participants, getComments, createComment } from '$lib/workshop/store.js';
import { getSession } from '$lib/session.js';

export const GET: RequestHandler = async ({ params }) => {
  const { usecaseId } = params;
  if (!useCases.has(usecaseId)) throw error(404, 'Use case not found');
  return json(getComments(usecaseId));
};

export const POST: RequestHandler = async ({ params, request, cookies }) => {
  const { workshopId, usecaseId } = params;
  if (!useCases.has(usecaseId)) throw error(404, 'Use case not found');

  const session = getSession(cookies);
  if (!session) throw error(401, 'Not authenticated');

  const body = await request.json().catch(() => null);
  const content = (body?.content as string)?.trim();
  if (!content) throw error(400, 'content is required');

  const participantId = `${workshopId}-${session.name.toLowerCase().replace(/\s+/g, '-')}`;
  const participant = participants.get(participantId);
  const authorName = participant?.name ?? session.name;
  const authorInitials = participant?.initials ?? session.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const authorColor = participant?.color ?? 'bg-gray-400';

  const comment = createComment({
    useCaseId: usecaseId,
    participantId,
    authorName,
    authorInitials,
    authorColor,
    content,
    workshopId,
  });

  return json(comment, { status: 201 });
};

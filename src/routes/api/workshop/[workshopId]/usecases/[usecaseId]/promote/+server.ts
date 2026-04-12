import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomUUID } from 'crypto';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { useCases, promoteUseCase } from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json().catch(() => null);
  if (!body) throw error(400, 'Request body is required');

  const { promotedBy, targetType } = body;

  if (!promotedBy || typeof promotedBy !== 'string') {
    throw error(400, 'promotedBy is required and must be a string');
  }

  if (!targetType || (targetType !== 'pipeline' && targetType !== 'mvbc')) {
    throw error(400, 'targetType must be either "pipeline" or "mvbc"');
  }

  if (isDatabaseEnabled && db) {
    const uc = await db.query.useCases.findFirst({
      where: eq(schema.useCases.id, params.usecaseId),
    });

    if (!uc || uc.workshopId !== params.workshopId) throw error(404, 'Use case not found');

    const [promotion] = await db
      .insert(schema.promotions)
      .values({
        id: randomUUID(),
        workshopId: params.workshopId,
        useCaseId: params.usecaseId,
        promotedBy,
        targetType,
      })
      .returning();

    return json(promotion);
  } else {
    const uc = useCases.get(params.usecaseId);
    if (!uc || uc.workshopId !== params.workshopId) throw error(404, 'Use case not found');

    const promotion = promoteUseCase(params.usecaseId, promotedBy, targetType);

    return json(promotion);
  }
};

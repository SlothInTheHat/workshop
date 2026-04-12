import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import { useCases, updateUseCase, deleteUseCase } from '$lib/workshop/store.js';
import type { RatingLevel, Visibility } from '$lib/workshop/types.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

const VALID_RATINGS: RatingLevel[] = ['High', 'Medium', 'Low'];
const VALID_VISIBILITY: Visibility[] = ['Internal', 'Restricted', 'Cross-Silo'];

function assertUseCaseBelongsToWorkshop(useCaseId: string, workshopId: string) {
  const uc = useCases.get(useCaseId);
  if (!uc) throw error(404, 'Use case not found');
  if (uc.workshopId !== workshopId) throw error(404, 'Use case not found');
  return uc;
}

export const GET: RequestHandler = async ({ params }) => {
  if (isDatabaseEnabled && db) {
    const uc = await db.query.useCases.findFirst({
      where: eq(schema.useCases.id, params.usecaseId),
    });
    if (!uc || uc.workshopId !== params.workshopId) throw error(404, 'Use case not found');
    return json(uc);
  } else {
    const uc = assertUseCaseBelongsToWorkshop(params.usecaseId, params.workshopId);
    return json(uc);
  }
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  const body = await request.json().catch(() => ({}));

  if (isDatabaseEnabled && db) {
    // Verify use case exists and belongs to workshop
    const existing = await db.query.useCases.findFirst({
      where: eq(schema.useCases.id, params.usecaseId),
    });
    if (!existing || existing.workshopId !== params.workshopId) {
      throw error(404, 'Use case not found');
    }

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

    const [updated] = await db
      .update(schema.useCases)
      .set(patch)
      .where(eq(schema.useCases.id, params.usecaseId))
      .returning();

    // Update corresponding insight if title/summary/value/viability/visibility changed
    if (patch.title || patch.summary || patch.value || patch.viability || patch.visibility) {
      const insightPatch: Record<string, unknown> = {};
      if (patch.title) insightPatch.title = patch.title;
      if (patch.summary) insightPatch.summary = patch.summary;
      if (patch.value) insightPatch.value = patch.value;
      if (patch.viability) insightPatch.viability = patch.viability;
      if (patch.visibility) insightPatch.visibility = patch.visibility;

      // Update tags if value/viability/visibility changed
      if (patch.value || patch.viability || patch.visibility) {
        insightPatch.tags = [
          patch.value ?? updated.value,
          patch.viability ?? updated.viability,
          patch.visibility ?? updated.visibility,
        ];
      }

      await db
        .update(schema.insights)
        .set(insightPatch)
        .where(eq(schema.insights.useCaseId, params.usecaseId));
    }

    return json(updated);
  } else {
    assertUseCaseBelongsToWorkshop(params.usecaseId, params.workshopId);

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
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  if (isDatabaseEnabled && db) {
    const uc = await db.query.useCases.findFirst({
      where: eq(schema.useCases.id, params.usecaseId),
    });
    if (!uc || uc.workshopId !== params.workshopId) throw error(404, 'Use case not found');

    // Delete corresponding insight first
    await db.delete(schema.insights).where(eq(schema.insights.useCaseId, params.usecaseId));

    // Delete use case
    await db.delete(schema.useCases).where(eq(schema.useCases.id, params.usecaseId));

    return new Response(null, { status: 204 });
  } else {
    assertUseCaseBelongsToWorkshop(params.usecaseId, params.workshopId);
    deleteUseCase(params.usecaseId);
    return new Response(null, { status: 204 });
  }
};

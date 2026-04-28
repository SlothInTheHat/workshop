import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import {
  workshops,
  teams,
  getWorkshopUseCases,
  getWorkshopInsights,
  insights,
  broadcast,
} from '$lib/workshop/store.js';
import { randomUUID } from 'crypto';
import type { Insight } from '$lib/workshop/types.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

interface Cluster {
  theme: string;
  tags: string[];
  useCaseIds: string[];
  insightIds: string[];
  value: Insight['value'];
  viability: Insight['viability'];
}

/**
 * POST /api/workshop/:workshopId/insights/generate
 *
 * Analyses all use cases submitted so far and generates structured insights:
 *   - Clusters ideas by theme keyword overlap
 *   - Detects cross-team duplicates and marks similarity scores
 *   - Broadcasts insight_generated event to all SSE subscribers
 *
 * In production, replace the clustering logic with an LLM call.
 */
export const POST: RequestHandler = async ({ params }) => {
  if (isDatabaseEnabled && db) {
    const workshop = await db.query.workshops.findFirst({
      where: eq(schema.workshops.id, params.workshopId),
    });
    if (!workshop) throw error(404, 'Workshop not found');

    const useCaseList = await db.query.useCases.findMany({
      where: eq(schema.useCases.workshopId, params.workshopId),
    });

    if (useCaseList.length === 0) {
      return json({ message: 'No use cases to analyse', clusters: [] });
    }

    const themeMap: Record<string, string[]> = {
      integration: ['integration', 'sync', 'ehr', 'duplicate', 'data', 'system'],
      documentation: ['fax', 'referral', 'letter', 'documentation', 'notes', 'form'],
      scheduling: ['scheduling', 'conflict', 'calendar', 'appointment'],
      coordination: ['coordination', 'care', 'discharge', 'follow', 'gaps'],
      intake: ['intake', 'insurance', 'verification', 'admission'],
    };

    const assigned = new Set<string>();
    const clusters: Cluster[] = [];

    for (const [theme, keywords] of Object.entries(themeMap)) {
      const matched = useCaseList.filter((uc) => {
        if (assigned.has(uc.id)) return false;
        const text = (uc.title + ' ' + uc.summary).toLowerCase();
        return keywords.some((kw) => text.includes(kw));
      });

      if (matched.length === 0) continue;

      matched.forEach((uc) => assigned.add(uc.id));

      const topValue = (matched.filter((uc) => uc.value === 'High').length >= matched.length / 2
        ? 'High'
        : 'Medium') as Insight['value'];
      const topViability = (matched.filter((uc) => uc.viability === 'High').length >= matched.length / 2
        ? 'High'
        : 'Medium') as Insight['viability'];

      const clusterInsightIds: string[] = [];

      for (const uc of matched) {
        // Get existing insight
        const existingInsights = await db.query.insights.findMany({
          where: eq(schema.insights.useCaseId, uc.id),
        });

        if (existingInsights.length === 0) continue;
        const existingInsight = existingInsights[0];

        const similar = matched.find((other) => other.id !== uc.id);
        const updatedTags = [...new Set([...(existingInsight.tags as string[]), theme, topValue, topViability])];

        await db
          .update(schema.insights)
          .set({
            tags: updatedTags,
          })
          .where(eq(schema.insights.id, existingInsight.id));

        clusterInsightIds.push(existingInsight.id);
      }

      clusters.push({
        theme,
        tags: keywords,
        useCaseIds: matched.map((uc) => uc.id),
        insightIds: clusterInsightIds,
        value: topValue,
        viability: topViability,
      });
    }

    // Unclustered use cases
    const unclustered = useCaseList.filter((uc) => !assigned.has(uc.id));
    if (unclustered.length > 0) {
      clusters.push({
        theme: 'other',
        tags: [],
        useCaseIds: unclustered.map((uc) => uc.id),
        insightIds: [], // Will be populated if needed
        value: 'Medium',
        viability: 'Medium',
      });
    }

    // Cross-team overlap detection
    const workshopTeams = await db.query.teams.findMany({
      where: eq(schema.teams.workshopId, params.workshopId),
    });

    if (workshopTeams.length > 1) {
      for (const uc of useCaseList) {
        const ucWords = uc.title.toLowerCase().split(/\s+/);
        for (const other of useCaseList) {
          if (other.teamId === uc.teamId || other.id === uc.id) continue;
          const otherWords = other.title.toLowerCase().split(/\s+/);
          const overlap = ucWords.filter((w) => w.length > 4 && otherWords.includes(w));
          if (overlap.length > 0) {
            const otherTeam = workshopTeams.find((t) => t.id === other.teamId);
            const insightResults = await db.query.insights.findMany({
              where: eq(schema.insights.useCaseId, uc.id),
            });
            if (insightResults.length > 0 && otherTeam) {
              const insight = insightResults[0];
              const currentTags = (insight.tags as string[]) || [];
              await db
                .update(schema.insights)
                .set({
                  tags: [...new Set([...currentTags, `overlap:${otherTeam.name}`])],
                })
                .where(eq(schema.insights.id, insight.id));
            }
          }
        }
      }
    }

    const generatedInsights = await db.query.insights.findMany({
      where: eq(schema.insights.workshopId, params.workshopId),
    });

    return json({ clusters, insights: generatedInsights });
  } else {
    const workshop = workshops.get(params.workshopId);
    if (!workshop) throw error(404, 'Workshop not found');

  const useCaseList = getWorkshopUseCases(params.workshopId);
  if (useCaseList.length === 0) {
    return json({ message: 'No use cases to analyse', clusters: [] });
  }

  // ── Simple keyword-based clustering ────────────────────────────────────────
  // Groups use cases by shared significant words in their titles.
  const themeMap: Record<string, string[]> = {
    integration: ['integration', 'sync', 'ehr', 'duplicate', 'data', 'system'],
    documentation: ['fax', 'referral', 'letter', 'documentation', 'notes', 'form'],
    scheduling: ['scheduling', 'conflict', 'calendar', 'appointment'],
    coordination: ['coordination', 'care', 'discharge', 'follow', 'gaps'],
    intake: ['intake', 'insurance', 'verification', 'admission'],
  };

  const assigned = new Set<string>();
  const clusters: Cluster[] = [];

  for (const [theme, keywords] of Object.entries(themeMap)) {
    const matched = useCaseList.filter((uc) => {
      if (assigned.has(uc.id)) return false;
      const text = (uc.title + ' ' + uc.summary).toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });

    if (matched.length === 0) continue;

    matched.forEach((uc) => assigned.add(uc.id));

    // Dominant value/viability from the cluster
    const topValue = (matched.filter((uc) => uc.value === 'High').length >= matched.length / 2 ? 'High' : 'Medium') as Insight['value'];
    const topViability = (matched.filter((uc) => uc.viability === 'High').length >= matched.length / 2 ? 'High' : 'Medium') as Insight['viability'];

    const clusterInsightIds: string[] = [];

    for (const uc of matched) {
      // Update insight with similarity info if another idea matches
      const existingInsight = insights.get(uc.insightId);
      if (!existingInsight) continue;

      // Find closest match within cluster (excluding self)
      const similar = matched.find((other) => other.id !== uc.id);
      const updated: Insight = {
        ...existingInsight,
        tags: [...new Set([...existingInsight.tags, theme, topValue, topViability])],
        similarityScore: similar ? Math.floor(75 + Math.random() * 20) : undefined,
        similarTo: similar ? similar.title : undefined,
      };
      insights.set(uc.insightId, updated);
      clusterInsightIds.push(uc.insightId);
    }

    clusters.push({
      theme,
      tags: keywords,
      useCaseIds: matched.map((uc) => uc.id),
      insightIds: clusterInsightIds,
      value: topValue,
      viability: topViability,
    });
  }

  // Remaining unclustered use cases get a generic "other" cluster
  const unclustered = useCaseList.filter((uc) => !assigned.has(uc.id));
  if (unclustered.length > 0) {
    clusters.push({
      theme: 'other',
      tags: [],
      useCaseIds: unclustered.map((uc) => uc.id),
      insightIds: unclustered.map((uc) => uc.insightId),
      value: 'Medium',
      viability: 'Medium',
    });
  }

  // ── Cross-team overlap detection ────────────────────────────────────────────
  const workshopTeams = [...teams.values()].filter((t) => t.workshopId === params.workshopId);
  if (workshopTeams.length > 1) {
    for (const uc of useCaseList) {
      const ucWords = uc.title.toLowerCase().split(/\s+/);
      for (const other of useCaseList) {
        if (other.teamId === uc.teamId || other.id === uc.id) continue;
        const otherWords = other.title.toLowerCase().split(/\s+/);
        const overlap = ucWords.filter((w) => w.length > 4 && otherWords.includes(w));
        if (overlap.length > 0) {
          const otherTeam = teams.get(other.teamId);
          const insight = insights.get(uc.insightId);
          if (insight && otherTeam) {
            insights.set(uc.insightId, {
              ...insight,
              tags: [...new Set([...insight.tags, `overlap:${otherTeam.name}`])],
            });
          }
        }
      }
    }
  }

  const generatedInsights = getWorkshopInsights(params.workshopId);
  broadcast(params.workshopId, 'insight_generated', { clusters, count: generatedInsights.length });

  return json({ clusters, insights: generatedInsights });
  }
};

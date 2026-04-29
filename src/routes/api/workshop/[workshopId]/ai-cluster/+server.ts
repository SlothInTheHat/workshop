import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import { workshops, getWorkshopUseCases } from '$lib/workshop/store.js';
import { getDb } from '$lib/db/index.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export const POST: RequestHandler = async ({ params }) => {
  const db = getDb();

  // Load use cases — prefer DB
  let useCases: any[] = getWorkshopUseCases(params.workshopId);
  let pillars: string[] = (workshops.get(params.workshopId) as any)?.strategicPillars ?? [];

  if (db) {
    try {
      const dbUc = await db.select().from(schema.useCases)
        .where(eq(schema.useCases.workshopId, params.workshopId));
      if (dbUc.length) useCases = dbUc;

      // Load strategic pillars from pre_workshops
      const preRows = await db.select().from(schema.preWorkshops)
        .where(eq(schema.preWorkshops.id, params.workshopId)).limit(1);
      if (preRows[0]?.strategicPillars?.length) {
        pillars = preRows[0].strategicPillars as string[];
      }
    } catch {}
  }

  if (!useCases.length) return json({ clusters: [] });
  if (useCases.length === 1) {
    return json({ clusters: [{ theme: useCases[0].title, useCaseIds: [useCases[0].id] }] });
  }

  // Always cluster by strategic pillars when available
  if (pillars.length > 0) {
    const pillarMap = new Map<string, string[]>();
    for (const pillar of pillars) pillarMap.set(pillar, []);
    const unaligned: string[] = [];

    for (const uc of useCases) {
      const tags: string[] = Array.isArray(uc.pillarTags) ? uc.pillarTags : [];
      const matched = tags.find((t: string) => pillars.some(p => p.toLowerCase() === t.toLowerCase()));
      if (matched) {
        const key = pillars.find(p => p.toLowerCase() === matched.toLowerCase()) ?? matched;
        pillarMap.get(key)!.push(uc.id);
      } else {
        unaligned.push(uc.id);
      }
    }

    const clusters = [...pillarMap.entries()]
      .filter(([, ids]) => ids.length > 0)
      .map(([theme, useCaseIds]) => ({ theme, useCaseIds }));

    if (unaligned.length > 0) clusters.push({ theme: 'Unaligned', useCaseIds: unaligned });
    if (clusters.length > 0) return json({ clusters });
  }

  // Semantic fallback — no pillars configured
  const prompt = `Group these AI use cases into semantic clusters based on similarity of purpose and domain.
Return ONLY a JSON array (no markdown fences, no explanation) in this exact format:
[{"theme":"Short cluster title","useCaseIds":["id1","id2"]}]

Rules:
- Every use case must appear in exactly one cluster
- Max 6 clusters
- Theme: 3-5 words, action-oriented (e.g. "Automated Documentation", "Patient Scheduling")
- Group by shared underlying purpose, not just shared keywords

Use cases:
${useCases.map(uc => `ID: ${uc.id}\nTitle: ${uc.title}\nSummary: ${uc.summary}`).join('\n\n')}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text).join('');
  const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();

  let clusters: { theme: string; useCaseIds: string[] }[];
  try {
    clusters = JSON.parse(cleaned);
    if (!Array.isArray(clusters)) throw new Error('not an array');
  } catch {
    clusters = [{ theme: 'All Use Cases', useCaseIds: useCases.map(uc => uc.id) }];
  }

  const allIds = new Set(useCases.map(uc => uc.id));
  const assigned = new Set(clusters.flatMap(c => c.useCaseIds));
  const missing = [...allIds].filter(id => !assigned.has(id));
  if (missing.length > 0) clusters.push({ theme: 'Other', useCaseIds: missing });

  return json({ clusters });
};

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import { workshops, getWorkshopUseCases } from '$lib/workshop/store.js';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export const POST: RequestHandler = async ({ params }) => {
  const workshop = workshops.get(params.workshopId);
  if (!workshop) throw error(404, 'Workshop not found');

  const useCases = getWorkshopUseCases(params.workshopId);
  if (useCases.length === 0) return json({ clusters: [] });

  if (useCases.length === 1) {
    return json({ clusters: [{ theme: useCases[0].title, useCaseIds: [useCases[0].id] }] });
  }

  // Pillar-based clustering: group use cases by their pillarTags against workshop's strategic pillars
  const pillars: string[] = (workshop as any).strategicPillars ?? [];
  if (pillars.length > 0) {
    const pillarMap = new Map<string, string[]>();
    for (const pillar of pillars) pillarMap.set(pillar, []);
    const unaligned: string[] = [];

    for (const uc of useCases) {
      const tags: string[] = (uc as any).pillarTags ?? [];
      const matched = tags.find(t => pillars.includes(t));
      if (matched) {
        pillarMap.get(matched)!.push(uc.id);
      } else {
        unaligned.push(uc.id);
      }
    }

    const clusters = [...pillarMap.entries()]
      .filter(([, ids]) => ids.length > 0)
      .map(([theme, useCaseIds]) => ({ theme, useCaseIds }));

    if (unaligned.length > 0) clusters.push({ theme: 'Unaligned', useCaseIds: unaligned });
    if (clusters.length > 0) return json({ clusters });
    // Fall through to semantic clustering if no pillar tags are set yet
  }

  // Semantic fallback (no pillars configured or no use cases have pillar tags yet)
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
    .map(b => b.text)
    .join('');

  const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim();

  let clusters: { theme: string; useCaseIds: string[] }[];
  try {
    clusters = JSON.parse(cleaned);
    if (!Array.isArray(clusters)) throw new Error('not an array');
  } catch {
    clusters = [{ theme: workshop.title, useCaseIds: useCases.map(uc => uc.id) }];
  }

  const allIds = new Set(useCases.map(uc => uc.id));
  const assigned = new Set(clusters.flatMap(c => c.useCaseIds));
  const missing = [...allIds].filter(id => !assigned.has(id));
  if (missing.length > 0) clusters.push({ theme: 'Other', useCaseIds: missing });

  return json({ clusters });
};

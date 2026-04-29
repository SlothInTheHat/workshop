import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomUUID } from 'crypto';
import { db, isDatabaseEnabled } from '$lib/db/index.js';
import {
  workshops,
  getWorkshopUseCases,
  calculateStackRank,
  saveSummary,
  getSummary,
} from '$lib/workshop/store.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import type { RankedUseCase } from '$lib/workshop/types.js';
import { ANTHROPIC_API_KEY } from '$env/static/private';

export const GET: RequestHandler = async ({ params }) => {
  if (isDatabaseEnabled && db) {
    const summaryRows = await db.select().from(schema.workshopSummaries)
      .where(eq(schema.workshopSummaries.workshopId, params.workshopId)).limit(1);
    if (!summaryRows.length) throw error(404, 'Summary not generated yet');
    return json(summaryRows[0]);
  } else {
    const workshop = workshops.get(params.workshopId);
    if (!workshop) throw error(404, 'Workshop not found');

    const summary = getSummary(params.workshopId);
    if (!summary) throw error(404, 'Summary not generated yet');

    return json(summary);
  }
};

export const POST: RequestHandler = async ({ params }) => {
  // console.log('[SUMMARY] Starting summary generation for workshop:', params.workshopId);
  // console.log('[SUMMARY] API key available:', !!ANTHROPIC_API_KEY);
  if (!ANTHROPIC_API_KEY) throw error(500, 'ANTHROPIC_API_KEY not configured');

  if (isDatabaseEnabled && db) {
    // Workshop may be in `workshops` (live) or `pre_workshops` (pre-phase) table
    // Find workshop — check live workshops table first, then pre_workshops
    let workshopTitle = params.workshopId;
    let workshopClient = '';
    let workshopObjectives = 'Not specified';
    let workshopPillars = 'Not specified';

    const liveWs = await db.select().from(schema.workshops)
      .where(eq(schema.workshops.id, params.workshopId)).limit(1);
    if (liveWs.length) {
      workshopTitle = liveWs[0].title;
      workshopClient = liveWs[0].client ?? '';
    } else {
      const preWs = await db.select().from(schema.preWorkshops)
        .where(eq(schema.preWorkshops.id, params.workshopId)).limit(1);
      if (preWs.length) {
        workshopTitle = preWs[0].title;
        workshopClient = preWs[0].tenantId ?? '';
        if (preWs[0].objective) workshopObjectives = preWs[0].objective;
        if (preWs[0].strategicPillars?.length) workshopPillars = (preWs[0].strategicPillars as string[]).join(', ');
      }
    }

    // Get all use cases
    const useCases = await db.select().from(schema.useCases)
      .where(eq(schema.useCases.workshopId, params.workshopId));

    // Guard: check if workshop has any use cases
    if (useCases.length === 0) {
      throw error(400, 'No use cases found. Complete the live workshop before generating a summary.');
    }

    // Get all scores
    const allScores = await db.select().from(schema.scores)
      .where(eq(schema.scores.workshopId, params.workshopId));

    // Calculate rankings (same logic as stackrank endpoint)
    const stackRank: RankedUseCase[] = useCases
      .map((uc) => {
        const ucScores = allScores.filter((s) => s.useCaseId === uc.id);

        let impactAvg = 0;
        let feasibilityAvg = 0;
        let alignmentAvg = 0;
        let executiveWeightAvg = 0;
        const scoreCount = ucScores.length;

        if (scoreCount > 0) {
          impactAvg = ucScores.reduce((sum, s) => sum + s.impact, 0) / scoreCount;
          feasibilityAvg = ucScores.reduce((sum, s) => sum + s.feasibility, 0) / scoreCount;
          alignmentAvg = ucScores.reduce((sum, s) => sum + s.alignment, 0) / scoreCount;
          executiveWeightAvg = ucScores.reduce((sum, s) => sum + s.executiveWeight, 0) / scoreCount;
        }

        const finalScore = impactAvg * feasibilityAvg + 2 * uc.upvotes + executiveWeightAvg;

        return {
          ...uc,
          finalScore,
          impactAvg,
          feasibilityAvg,
          alignmentAvg,
          executiveWeightAvg,
          scoreCount,
          createdAt: uc.createdAt.toISOString(),
        } as RankedUseCase;
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    // Build prompt
    const prompt = `You are analyzing a workshop that generated ${useCases.length} use cases. Provide a structured summary in JSON format.

Workshop: ${workshopTitle}
Client: ${workshopClient}
Workshop Objectives: ${workshopObjectives}
Strategic Pillars: ${workshopPillars}

Use Cases by Rank:
${stackRank
  .map(
    (uc, idx) =>
      `${idx + 1}. "${uc.title}" (Team: ${uc.teamId})
   Summary: ${uc.summary}
   Value: ${uc.value}, Viability: ${uc.viability}, Visibility: ${uc.visibility}
   Final Score: ${uc.finalScore.toFixed(2)} | Upvotes: ${uc.upvotes}
   Avg Scores - Impact: ${uc.impactAvg.toFixed(1)}, Feasibility: ${uc.feasibilityAvg.toFixed(1)}, Alignment: ${uc.alignmentAvg.toFixed(1)}, Executive Weight: ${uc.executiveWeightAvg.toFixed(1)}
   Score Count: ${uc.scoreCount}
`
  )
  .join('\n')}

Return ONLY valid JSON in this exact structure:
{
  "overview": "2-3 sentence executive summary of workshop outcomes",
  "keyBottlenecks": "1-2 sentences describing main bottlenecks identified across use cases",
  "aiSuggestedThemes": "Comma-separated list of 3-5 key themes (e.g., 'Workflow Optimization (X insights), Data Integration, Process Automation')",
  "crossWorkshopSignals": "1-2 sentences about patterns that might appear across similar workshops or enterprise-wide themes",
  "recommendedFocusAreas": "1-2 sentences with top 3-5 prioritized recommendations based on rankings",
  "fullSummary": "Complete narrative summary combining all above insights in 4-5 paragraphs",
  "perUseCaseInsights": [
    {
      "useCaseId": "the-actual-uuid-from-the-use-case",
      "whyItMatters": "One sentence explaining why solving this matters to the client and what business impact it would have"
    }
  ]
}`;


    try {
      // console.log('[SUMMARY] Creating Anthropic client');
      const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

      // console.log('[SUMMARY] Calling Claude API with', useCases.length, 'use cases');
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      // console.log('[SUMMARY] Received response from Claude API');
      const textContent = message.content[0].type === 'text' ? message.content[0].text : '';
      if (!textContent) throw error(500, 'Failed to generate summary');

      // Parse JSON response
      let parsedContent;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = textContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || textContent.match(/(\{[\s\S]*\})/);
        const jsonString = jsonMatch ? jsonMatch[1] : textContent;
        parsedContent = JSON.parse(jsonString);
        // console.log('[SUMMARY] Successfully parsed JSON response');
      } catch (parseErr) {
        console.error('[SUMMARY] Failed to parse AI response as JSON:', parseErr);
        console.error('[SUMMARY] Raw response:', textContent.substring(0, 500));
        // Fallback: create structured response from text
        parsedContent = {
          overview: textContent.substring(0, 200),
          keyBottlenecks: '',
          aiSuggestedThemes: '',
          crossWorkshopSignals: '',
          recommendedFocusAreas: '',
          fullSummary: textContent,
          perUseCaseInsights: []
        };
      }

      // console.log('[SUMMARY] Saving to database');
      const [summary] = await db
        .insert(schema.workshopSummaries)
        .values({
          id: randomUUID(),
          workshopId: params.workshopId,
          content: parsedContent,
        })
        .returning();

      // Update each use case with its whyItMatters insight
      if (parsedContent.perUseCaseInsights && Array.isArray(parsedContent.perUseCaseInsights)) {
        // console.log('[SUMMARY] Updating use cases with whyItMatters insights');
        for (const insight of parsedContent.perUseCaseInsights) {
          if (insight.useCaseId && insight.whyItMatters) {
            await db
              .update(schema.useCases)
              .set({ whyItMatters: insight.whyItMatters })
              .where(eq(schema.useCases.id, insight.useCaseId));
            // console.log(`[SUMMARY] Updated use case ${insight.useCaseId} with whyItMatters`);
          }
        }
      }

      // console.log('[SUMMARY] Summary saved successfully:', summary.id);
      return json(summary);
    } catch (err) {
      console.error('[SUMMARY] Error generating summary:', err);
      throw error(500, 'Failed to generate summary');
    }
  } else {
    const workshop = workshops.get(params.workshopId);
    if (!workshop) throw error(404, 'Workshop not found');

    const useCases = getWorkshopUseCases(params.workshopId);

    // Guard: check if workshop has any use cases
    if (useCases.length === 0) {
      throw error(400, 'No use cases found. Complete the live workshop before generating a summary.');
    }

    const stackRank = calculateStackRank(params.workshopId);

    const workshopObjectives = Array.isArray(workshop.objectives) ? workshop.objectives.join(', ') : 'Not specified';
    const workshopPillars = Array.isArray(workshop.strategicPillars) ? workshop.strategicPillars.join(', ') : 'Not specified';

    const prompt = `You are analyzing a workshop that generated ${useCases.length} use cases. Provide a structured summary in JSON format.

Workshop: ${workshop.title}
Client: ${workshop.client}
Workshop Objectives: ${workshopObjectives}
Strategic Pillars: ${workshopPillars}

Use Cases by Rank:
${stackRank
  .map(
    (uc, idx) =>
      `${idx + 1}. "${uc.title}" (Team: ${uc.teamId})
   Summary: ${uc.summary}
   Value: ${uc.value}, Viability: ${uc.viability}, Visibility: ${uc.visibility}
   Final Score: ${uc.finalScore.toFixed(2)} | Upvotes: ${uc.upvotes}
   Avg Scores - Impact: ${uc.impactAvg.toFixed(1)}, Feasibility: ${uc.feasibilityAvg.toFixed(1)}, Alignment: ${uc.alignmentAvg.toFixed(1)}, Executive Weight: ${uc.executiveWeightAvg.toFixed(1)}
   Score Count: ${uc.scoreCount}
`
  )
  .join('\n')}

Return ONLY valid JSON in this exact structure:
{
  "overview": "2-3 sentence executive summary of workshop outcomes",
  "keyBottlenecks": "1-2 sentences describing main bottlenecks identified across use cases",
  "aiSuggestedThemes": "Comma-separated list of 3-5 key themes (e.g., 'Workflow Optimization (X insights), Data Integration, Process Automation')",
  "crossWorkshopSignals": "1-2 sentences about patterns that might appear across similar workshops or enterprise-wide themes",
  "recommendedFocusAreas": "1-2 sentences with top 3-5 prioritized recommendations based on rankings",
  "fullSummary": "Complete narrative summary combining all above insights in 4-5 paragraphs",
  "perUseCaseInsights": [
    {
      "useCaseId": "the-actual-uuid-from-the-use-case",
      "whyItMatters": "One sentence explaining why solving this matters to the client and what business impact it would have"
    }
  ]
}`;

    try {
      // console.log('[SUMMARY] [In-memory] Creating Anthropic client');
      const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

      // console.log('[SUMMARY] [In-memory] Calling Claude API with', useCases.length, 'use cases');
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      // console.log('[SUMMARY] [In-memory] Received response from Claude API');
      const textContent = message.content[0].type === 'text' ? message.content[0].text : '';
      if (!textContent) throw error(500, 'Failed to generate summary');

      // Parse JSON response
      let parsedContent;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = textContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || textContent.match(/(\{[\s\S]*\})/);
        const jsonString = jsonMatch ? jsonMatch[1] : textContent;
        parsedContent = JSON.parse(jsonString);
        // console.log('[SUMMARY] [In-memory] Successfully parsed JSON response');
      } catch (parseErr) {
        console.error('[SUMMARY] [In-memory] Failed to parse AI response as JSON:', parseErr);
        console.error('[SUMMARY] [In-memory] Raw response:', textContent.substring(0, 500));
        // Fallback: create structured response from text
        parsedContent = {
          overview: textContent.substring(0, 200),
          keyBottlenecks: '',
          aiSuggestedThemes: '',
          crossWorkshopSignals: '',
          recommendedFocusAreas: '',
          fullSummary: textContent,
          perUseCaseInsights: []
        };
      }

      // console.log('[SUMMARY] [In-memory] Saving to in-memory store');
      const summary = saveSummary(params.workshopId, parsedContent);

      // Update each use case with its whyItMatters insight
      if (parsedContent.perUseCaseInsights && Array.isArray(parsedContent.perUseCaseInsights)) {
        // console.log('[SUMMARY] [In-memory] Updating use cases with whyItMatters insights');
        for (const insight of parsedContent.perUseCaseInsights) {
          if (insight.useCaseId && insight.whyItMatters) {
            const uc = useCases.find(u => u.id === insight.useCaseId);
            if (uc) {
              uc.whyItMatters = insight.whyItMatters;
              // console.log(`[SUMMARY] [In-memory] Updated use case ${insight.useCaseId} with whyItMatters`);
            }
          }
        }
      }

      // console.log('[SUMMARY] [In-memory] Summary saved successfully');
      return json(summary);
    } catch (err) {
      console.error('[SUMMARY] [In-memory] Error generating summary:', err);
      throw error(500, 'Failed to generate summary');
    }
  }
};

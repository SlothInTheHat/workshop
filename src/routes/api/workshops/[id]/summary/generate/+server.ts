import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

// POST /api/workshops/[id]/summary/generate
export const POST: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	if (!db) error(503, 'Database not available');

	if (!ANTHROPIC_API_KEY) error(500, 'ANTHROPIC_API_KEY not configured');

	const body = (await request.json()) as { actorName?: string };

	// Get workshop
	const workshops = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.id, params.id));
	if (workshops.length === 0) error(404, 'Workshop not found');
	const workshop = workshops[0];

	// Get all participants
	const participants = await db
		.select()
		.from(schema.preParticipants)
		.where(eq(schema.preParticipants.workshopId, params.id));

	// Get all contributor inputs
	const inputs = await db
		.select()
		.from(schema.contributorInputs)
		.where(eq(schema.contributorInputs.workshopId, params.id));

	if (inputs.length === 0) {
		error(400, 'No contributor inputs found. At least one contributor must submit input.');
	}

	// Build comprehensive context for AI
	const inputsContext = inputs
		.map((input, i) => {
			const participant = participants.find((p) => p.id === input.participantId);
			return `
=== Contributor ${i + 1}: ${participant?.name ?? 'Anonymous'} ===

Goals & Objectives:
${input.goalsAndObjectives ?? 'Not provided'}

Pain Points:
${input.painPoints ?? 'Not provided'}

Current Workflow:
${input.currentWorkflow ?? 'Not provided'}

Constraints:
${input.constraints ?? 'Not provided'}

Success Criteria:
${input.successCriteria ?? 'Not provided'}

Strategic Pillars:
${input.strategicPillars ?? 'Not provided'}
`;
		})
		.join('\n\n');

	const prompt = `You are preparing a kickoff summary for an upcoming workshop. Here is the workshop information:

**Workshop Title:** ${workshop.title}
**Focus Area:** ${workshop.focusArea ?? 'Not specified'}
**Objective:** ${workshop.objective ?? 'Not specified'}
**Number of Contributors:** ${inputs.length}
**AI-Generated Strategic Pillars:** ${workshop.strategicPillars?.join(', ') ?? 'Not yet generated'}

**Contributor Inputs:**
${inputsContext}

Based on this pre-workshop input, generate a comprehensive kickoff summary that:

1. Synthesizes the key themes, goals, and pain points across all contributors
2. Highlights common workflows and constraints that should be considered
3. Summarizes the success criteria contributors care about
4. Identifies the most important strategic priorities
5. Provides 3-5 specific focus areas or questions for the live workshop

The summary should be:
- Clear and executive-friendly (suitable for reading at the start of the workshop)
- 3-5 paragraphs
- Action-oriented and focused on workshop outcomes

Write the summary as a cohesive narrative, not as bullet points.`;

	try {
		const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

		const response = await anthropic.messages.create({
			model: 'claude-sonnet-4-5-20250929',
			max_tokens: 2000,
			messages: [{ role: 'user', content: prompt }]
		});

		const summary = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

		if (!summary) {
			error(500, 'Failed to generate kickoff summary');
		}

		// Update workshop with kickoff summary
		await db
			.update(schema.preWorkshops)
			.set({
				kickoffSummary: summary,
				updatedAt: new Date()
			})
			.where(eq(schema.preWorkshops.id, params.id));

		// Log activity
		await db.insert(schema.activityLogs).values({
			id: crypto.randomUUID(),
			workshopId: params.id,
			tenantId: workshop.tenantId,
			actorName: body.actorName ?? 'Facilitator',
			action: 'summary_generated',
			details: 'Generated kickoff summary from contributor inputs',
			createdAt: new Date()
		});

		return json({ kickoffSummary: summary });
	} catch (err) {
		console.error('[AI] Failed to generate kickoff summary:', err);
		error(500, 'Failed to generate kickoff summary');
	}
};

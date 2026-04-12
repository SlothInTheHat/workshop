import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

// POST /api/workshops/[id]/context — generate AI context from submitted inputs
export const POST: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	const body = (await request.json()) as { actorName?: string };

	const workshopRows = await db
		.select()
		.from(schema.workshops)
		.where(eq(schema.workshops.id, params.id));
	if (workshopRows.length === 0) error(404, 'Workshop not found');
	const workshop = workshopRows[0];

	const participants = await db
		.select()
		.from(schema.participants)
		.where(eq(schema.participants.workshopId, params.id));

	const inputs = await db
		.select()
		.from(schema.contributorInputs)
		.where(eq(schema.contributorInputs.workshopId, params.id));

	if (inputs.length === 0) {
		error(400, 'No contributor inputs found. Ask contributors to submit their pre-workshop input first.');
	}

	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) error(500, 'ANTHROPIC_API_KEY is not configured');

	const client = new Anthropic({ apiKey });

	// Build participant input summary
	const inputSummaries = inputs
		.map((inp) => {
			const participant = participants.find((p) => p.id === inp.participantId);
			const name = participant?.name ?? 'Unknown Participant';
			const role = participant?.role ?? 'contributor';
			return `
**${name}** (${role})
- Goals & Objectives: ${inp.goalsAndObjectives ?? 'Not provided'}
- Pain Points: ${inp.painPoints ?? 'Not provided'}
- Current Workflow: ${inp.currentWorkflow ?? 'Not provided'}
- Constraints: ${inp.constraints ?? 'Not provided'}
- Success Criteria: ${inp.successCriteria ?? 'Not provided'}`.trim();
		})
		.join('\n\n');

	const prompt = `You are a workshop facilitator assistant helping to prepare for a structured discovery workshop.

Workshop Details:
- Title: ${workshop.title}
- Focus Area: ${workshop.focusArea ?? 'Not specified'}
- Objective: ${workshop.objective ?? 'Not specified'}
- Data Sensitivity: ${workshop.dataSensitivity}

The following pre-workshop inputs have been submitted by ${inputs.length} participant(s):

${inputSummaries}

Based on these inputs, generate a comprehensive workshop context document that:
1. Identifies 3-5 common themes and patterns across participants
2. Highlights the key pain points and challenges shared by multiple participants
3. Outlines 3-4 potential opportunity areas for the workshop to explore
4. Suggests specific focus areas that will drive the most value
5. Notes any significant constraints or success criteria to keep in mind

Write in a professional, enterprise-ready tone. Be specific and actionable. Format with clear sections.`;

	const message = await client.messages.create({
		model: 'claude-sonnet-4-5',
		max_tokens: 1024,
		messages: [{ role: 'user', content: prompt }]
	});

	const content = message.content[0];
	const aiContext = content.type === 'text' ? content.text : '';

	await db
		.update(schema.workshops)
		.set({ aiContext, updatedAt: new Date() })
		.where(eq(schema.workshops.id, params.id));

	await db.insert(schema.activityLogs).values({
		id: crypto.randomUUID(),
		workshopId: params.id,
		tenantId: workshop.tenantId,
		actorName: body.actorName ?? 'Facilitator',
		action: 'context_generated',
		details: `AI context generated from ${inputs.length} contributor input(s)`,
		createdAt: new Date()
	});

	return json({ aiContext });
};

// PATCH /api/workshops/[id]/context — manually update AI context
export const PATCH: RequestHandler = async ({ params, request }) => {
	const db = getDb();
	const body = (await request.json()) as { aiContext: string };

	if (body.aiContext === undefined) error(400, 'aiContext is required');

	await db
		.update(schema.workshops)
		.set({ aiContext: body.aiContext, updatedAt: new Date() })
		.where(eq(schema.workshops.id, params.id));

	return json({ success: true });
};

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

// POST /api/ai/kickoff-summary — generate a kickoff summary from workshop setup details
export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as {
		title: string;
		focusArea?: string;
		objective?: string;
		dataSensitivity?: string;
	};

	if (!body.title?.trim()) error(400, 'title is required');

	if (!ANTHROPIC_API_KEY) error(500, 'ANTHROPIC_API_KEY is not configured');

	const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

	const prompt = `You are an expert workshop facilitator. Generate a concise, professional kickoff summary for a discovery workshop.

Workshop Details:
- Title: ${body.title}
- Focus Area: ${body.focusArea ?? 'Not specified'}
- Objective: ${body.objective ?? 'Not specified'}
- Data Sensitivity: ${body.dataSensitivity ?? 'internal'}

Write a kickoff summary (2-3 short paragraphs) that:
1. Describes what the workshop will explore and why it matters
2. Lists 3-4 specific themes or opportunity areas the workshop will focus on
3. Explains how the AI Analyst will help during the live session

Keep it concise, professional, and motivating for participants. Do not use bullet points for the main paragraphs — write in prose.`;

	const message = await client.messages.create({
		model: 'claude-sonnet-4-5',
		max_tokens: 512,
		messages: [{ role: 'user', content: prompt }]
	});

	const content = message.content[0];
	const summary = content.type === 'text' ? content.text : '';

	return json({ summary });
};

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb, schema } from '$lib/db/index';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

// POST /api/workshops/[id]/pillars/generate
export const POST: RequestHandler = async ({ params }) => {
	const db = getDb();
	if (!db) error(503, 'Database not available');

	if (!ANTHROPIC_API_KEY) error(500, 'ANTHROPIC_API_KEY not configured');

	// Get workshop
	const workshops = await db
		.select()
		.from(schema.preWorkshops)
		.where(eq(schema.preWorkshops.id, params.id));
	if (workshops.length === 0) error(404, 'Workshop not found');
	const workshop = workshops[0];

	// Get all contributor inputs for this workshop
	const inputs = await db
		.select()
		.from(schema.contributorInputs)
		.where(eq(schema.contributorInputs.workshopId, params.id));

	if (inputs.length === 0) {
		error(400, 'No contributor inputs found. At least one contributor must submit input.');
	}

	// Extract all strategic pillars from inputs
	const allPillars = inputs
		.map((input) => input.strategicPillars)
		.filter((p) => p && p.trim().length > 0)
		.join('\n\n');

	if (!allPillars.trim()) {
		error(400, 'No strategic pillars found in contributor inputs.');
	}

	// Use Claude to synthesize 3-5 strategic pillars
	const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

	const prompt = `You are analyzing pre-workshop input for "${workshop.title}" ${workshop.focusArea ? `focused on ${workshop.focusArea}` : ''}.

Contributors were asked to identify 3-5 strategic pillars that should guide this workshop. Here are their responses:

${allPillars}

Based on these inputs, synthesize exactly 3-5 strategic pillars that:
1. Capture the most common themes and priorities
2. Are concise and actionable (2-4 words each)
3. Cover the key strategic areas mentioned
4. Can be used as tags in the live workshop

Return ONLY a comma-separated list of the pillars, nothing else. For example:
Patient Experience, Operational Efficiency, Data Quality, Staff Satisfaction

Do not include numbering, explanations, or any other text.`;

	try {
		const response = await anthropic.messages.create({
			model: 'claude-sonnet-4-5-20250929',
			max_tokens: 200,
			messages: [{ role: 'user', content: prompt }]
		});

		const pillarsText =
			response.content[0].type === 'text' ? response.content[0].text.trim() : '';

		if (!pillarsText) {
			error(500, 'Failed to generate strategic pillars');
		}

		// Parse pillars into array
		const pillarsArray = pillarsText
			.split(',')
			.map((p) => p.trim())
			.filter((p) => p.length > 0);

		// Update workshop with generated pillars
		await db
			.update(schema.preWorkshops)
			.set({
				strategicPillars: pillarsArray,
				updatedAt: new Date()
			})
			.where(eq(schema.preWorkshops.id, params.id));

		// Log activity
		await db.insert(schema.activityLogs).values({
			id: crypto.randomUUID(),
			workshopId: params.id,
			tenantId: workshop.tenantId,
			actorName: 'AI',
			action: 'pillars_generated',
			details: `Generated ${pillarsArray.length} strategic pillars: ${pillarsArray.join(', ')}`,
			createdAt: new Date()
		});

		return json({ pillars: pillarsArray });
	} catch (err) {
		console.error('[AI] Failed to generate pillars:', err);
		error(500, 'Failed to generate strategic pillars');
	}
};

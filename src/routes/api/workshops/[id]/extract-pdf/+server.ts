import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request, params }) => {
  const formData = await request.formData();
  const file = formData.get('pdf') as File;

  if (!file || file.type !== 'application/pdf') {
    throw error(400, 'Please upload a valid PDF file');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw error(400, 'PDF must be under 10MB');
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          }
        },
        {
          type: 'text',
          text: `Based on this document, extract information to fill out a workshop pre-work form.
          Return ONLY valid JSON with these exact fields:
          {
            "goalsAndObjectives": "What goals and objectives can you identify from this document? 2-4 sentences.",
            "painPoints": "What pain points, challenges, or problems are mentioned? 2-4 sentences.",
            "currentWorkflow": "What does the current workflow or process look like based on this document? 2-4 sentences.",
            "constraints": "What constraints, limitations, or blockers are mentioned? 2-4 sentences.",
            "successCriteria": "What would success look like based on this document? 2-4 sentences.",
            "strategicPillars": "What are the key strategic priorities or pillars mentioned? 2-4 sentences."
          }
          If information for a field is not found, provide a reasonable inference or leave as empty string.
          Return ONLY the JSON object, no other text.`
        }
      ]
    }]
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const extracted = JSON.parse(clean);
    return json(extracted);
  } catch (err) {
    throw error(500, 'Failed to parse AI response');
  }
};

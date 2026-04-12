import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';

const client = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, summary } = body;

    if (!title || !summary) {
      throw error(400, 'title and summary are required');
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: `In one sentence, explain why this matters to the client: ${title} - ${summary}`,
        },
      ],
    });

    const whyItMatters = message.content[0].type === 'text' ? message.content[0].text : '';

    return json({ whyItMatters });
  } catch (err) {
    console.error('Error generating Why It Matters:', err);
    throw error(500, 'Failed to generate Why It Matters');
  }
};

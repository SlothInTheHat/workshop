import type { RequestEvent } from '@sveltejs/kit';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import { workshops, getWorkshopUseCases, getWorkshopParticipants, useCases } from '$lib/workshop/store';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const POST = async ({ request, params }: RequestEvent) => {
  const { workshopId } = params as { workshopId: string };
  const { message, history, useCaseId } = await request.json() as {
    message: string;
    history: ChatMessage[];
    useCaseId?: string;
  };

  const workshop = workshops.get(workshopId) ?? null;
  const allUsecases = getWorkshopUseCases(workshopId);
  const participants = getWorkshopParticipants(workshopId);

  const workshopContext = workshop
    ? `Workshop: "${workshop.title}" for client "${workshop.client}". Status: ${workshop.status}.`
    : `Workshop ID: ${workshopId}`;

  // Edit mode — focus on the specific card
  const targetCard = useCaseId ? useCases.get(useCaseId) : null;

  const usecaseContext = allUsecases.length
    ? `All use cases in this workshop (${allUsecases.length} total):\n${allUsecases.map(u => `- "${u.title}": ${u.summary} [Value: ${u.value}, Viability: ${u.viability}]`).join('\n')}`
    : 'No use cases submitted yet.';

  const systemPrompt = targetCard
    ? `You are an AI Analyst helping a participant improve an existing use case in a live workshop.

Context:
${workshopContext}
Participants: ${participants.map(p => p.name).join(', ')}

USE CASE BEING EDITED:
Title: ${targetCard.title}
Summary: ${targetCard.summary}
Value: ${targetCard.value}
Viability: ${targetCard.viability}
Visibility: ${targetCard.visibility}
Added by: ${targetCard.addedBy}

${usecaseContext}

Your role:
1. Understand what the participant wants to change or improve
2. Help them refine the title, summary, value/viability ratings, or framing
3. When you have a concrete improvement to propose, output ONLY this JSON at the END of your message:

<usecase_preview>
{
  "title": "Improved title (max 8 words)",
  "summary": "Improved one-sentence description",
  "value": "High|Medium|Low",
  "viability": "High|Medium|Low"
}
</usecase_preview>

Keep responses concise (1-2 sentences). Use "Value" (not Impact) and "Viability" (not Feasibility). Only propose the update tag when you have a concrete, specific improvement — not after every message.`
    : `You are an AI Analyst helping participants in a live AI use case workshop structure their ideas into actionable AI use cases.

Context:
${workshopContext}
Participants: ${participants.map(p => p.name).join(', ')}

${usecaseContext}

Your role:
1. Help participants articulate their use case ideas clearly
2. Ask clarifying questions to understand the problem, value, and feasibility
3. When you have enough information, generate a structured use case preview in this EXACT JSON format at the END of your message:

<usecase_preview>
{
  "title": "Short descriptive title (max 8 words)",
  "summary": "One sentence describing the AI use case",
  "value": "High|Medium|Low",
  "viability": "High|Medium|Low"
}
</usecase_preview>

Keep responses concise (2-3 sentences max). Ask one focused question at a time. Only generate the preview once you understand the core problem, who benefits, and what AI capability would help.

Use "Value" (not Impact) and "Viability" (not Feasibility).`;

  const messages: Anthropic.MessageParam[] = [
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ];

  const stream = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
};

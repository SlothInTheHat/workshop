import type { RequestEvent } from '@sveltejs/kit';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY } from '$env/static/private';
import { workshops, getWorkshopUseCases, getWorkshopParticipants, useCases } from '$lib/workshop/store';
import { getDb } from '$lib/db/index.js';
import * as schema from '$lib/db/schema.js';
import { eq } from 'drizzle-orm';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const POST = async ({ request, params }: RequestEvent) => {
  const { workshopId } = params as { workshopId: string };
  const { message, history, useCaseId, mode } = await request.json() as {
    message: string;
    history: ChatMessage[];
    useCaseId?: string;
    mode?: 'workshop';
  };

  const db = getDb();
  const workshop = workshops.get(workshopId) ?? null;
  let allUsecases = getWorkshopUseCases(workshopId);
  let participants = getWorkshopParticipants(workshopId);

  // Prefer DB data when available
  if (db) {
    try {
      const dbUc = await db.select().from(schema.useCases).where(eq(schema.useCases.workshopId, workshopId));
      if (dbUc.length) allUsecases = dbUc as any;
      const dbParts = await db.select().from(schema.liveParticipants).where(eq(schema.liveParticipants.workshopId, workshopId));
      if (dbParts.length) participants = dbParts as any;
    } catch {}
  }

  const workshopContext = workshop
    ? `Workshop: "${workshop.title}" for client "${workshop.client}". Status: ${workshop.status}.`
    : `Workshop ID: ${workshopId}`;

  const objectiveContext = workshop?.objective
    ? `\nWorkshop Objective: ${workshop.objective}`
    : '';

  const pillarsContext = (workshop as any)?.strategicPillars?.length
    ? `\nStrategic Pillars: ${(workshop as any).strategicPillars.join(', ')}`
    : '';

  // Edit mode — focus on the specific card
  const targetCard = useCaseId ? useCases.get(useCaseId) : null;

  const usecaseContext = allUsecases.length
    ? `All use cases (${allUsecases.length} total):\n${allUsecases.map((u: any) => `- "${u.title}": ${u.summary} [Value: ${u.value}, Viability: ${u.viability}]`).join('\n')}`
    : 'No use cases submitted yet.';

  // ── Workshop Overview mode (right-panel general assistant) ─────────────────
  if (mode === 'workshop') {
    const participantList = participants.length
      ? participants.map((p: any) => `  - ${p.name} (${p.role ?? 'contributor'})`).join('\n')
      : '  None yet';

    const workshopSystemPrompt = `You are a Workshop Intelligence Assistant with full visibility into this live workshop.

WORKSHOP DETAILS:
${workshopContext}${objectiveContext}${pillarsContext}

PARTICIPANTS (${participants.length}):
${participantList}

USE CASES SUBMITTED SO FAR:
${allUsecases.length ? allUsecases.map((u: any, i: number) => `${i + 1}. "${u.title}" — ${u.summary}\n   Value: ${u.value} | Viability: ${u.viability} | By: ${u.addedBy}`).join('\n') : 'None yet.'}

YOUR ROLE:
You are a strategic advisor for the facilitator and participants. You can:
- Summarise progress and themes emerging across use cases
- Identify patterns, duplicates, or gaps in the submissions
- Suggest which use cases to prioritise based on value/viability
- Answer questions about specific participants or use cases
- Provide strategic recommendations aligned with the workshop objective and pillars
- Help the facilitator understand the overall picture

You have full context of all submissions. Be analytical, concise, and actionable.
Do NOT generate <usecase_preview> JSON — that is only for the per-card assistant.`;

    const messages: Anthropic.MessageParam[] = [
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ];

    const stream = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: workshopSystemPrompt,
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
        } catch (err) { controller.error(err); }
      },
    });
    return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }

  const systemPrompt = targetCard
    ? `You are an AI Analyst helping a participant improve an existing use case in a live workshop.

Context:
${workshopContext}${objectiveContext}${pillarsContext}
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
  "viability": "High|Medium|Low",
  "pillarTags": ["Pillar Name"]
}
</usecase_preview>

Keep responses concise (1-2 sentences). Use "Value" (not Impact) and "Viability" (not Feasibility). Only propose the update tag when you have a concrete, specific improvement — not after every message.`
    : `You are an AI Analyst helping participants in a live AI use case workshop structure their ideas into actionable AI use cases.

Context:
${workshopContext}${objectiveContext}${pillarsContext}
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
  "viability": "High|Medium|Low",
  "pillarTags": ["Most relevant strategic pillar"]
}
</usecase_preview>

Keep responses concise (2-3 sentences max). Ask one focused question at a time. Only generate the preview once you understand the core problem, who benefits, and what AI capability would help.

Use "Value" (not Impact) and "Viability" (not Feasibility). When suggesting pillarTags, choose from the workshop's strategic pillars if available.`;

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

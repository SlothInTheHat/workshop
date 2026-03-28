import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { workshops, subscribeTo } from '$lib/workshop/store.js';
import type { WorkshopEvent } from '$lib/workshop/types.js';

/**
 * GET /api/workshop/:workshopId/stream
 *
 * Server-Sent Events endpoint for real-time workshop collaboration.
 *
 * Clients connect and receive a stream of WorkshopEvent objects whenever
 * any participant submits or updates a use case, modifies team membership,
 * or triggers insight generation.
 *
 * Event format (text/event-stream):
 *   data: <JSON-serialised WorkshopEvent>\n\n
 *
 * The client should reconnect automatically on disconnect (SSE default).
 * A heartbeat comment is sent every 15 seconds to keep the connection alive.
 */
export const GET: RequestHandler = async ({ params, request }) => {
  if (!workshops.has(params.workshopId)) throw error(404, 'Workshop not found');

  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const encode = (text: string) => new TextEncoder().encode(text);

      // Send an initial connection confirmation
      controller.enqueue(encode(`: connected to workshop ${params.workshopId}\n\n`));

      const enqueue = (event: WorkshopEvent) => {
        try {
          controller.enqueue(encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Controller may be closed if client disconnected
        }
      };

      unsubscribe = subscribeTo(params.workshopId, enqueue);

      // Heartbeat to prevent proxies from closing idle connections
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);
    },
    cancel() {
      unsubscribe?.();
      clearInterval(heartbeat);
    },
  });

  // Respect client disconnect
  request.signal.addEventListener('abort', () => {
    unsubscribe?.();
    clearInterval(heartbeat);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
};

import { NextRequest } from 'next/server';

import { getParameterData } from '@/lib/parameter-data';
import type { Parameter } from '@/lib/types';

const encoder = new TextEncoder();
const POLL_INTERVAL_MS = Math.max(
  1000,
  Number(process.env.PARAMETER_STREAM_POLL_INTERVAL_MS ?? '3000'),
);

type RouteParams = { dashboard: string; parameterId: string };

type HandlerContext = { params: Promise<RouteParams> };

function decodeParam(value: string): string {
  return decodeURIComponent(value);
}

const DISPLAY_TYPES = new Set<Parameter['displayType']>([
  'radial-gauge',
  'line',
  'stat',
  'bar',
  'progress',
  'linear-gauge',
  'status-light',
]);

function parseDisplayType(raw: string | null): Parameter['displayType'] {
  if (!raw) {
    return 'stat';
  }
  const candidate = raw as Parameter['displayType'];
  return DISPLAY_TYPES.has(candidate) ? candidate : 'stat';
}

function parseOptionalName(raw: string | null): string | undefined {
  if (!raw) {
    return undefined;
  }
  const value = raw.trim();
  return value ? value : undefined;
}

function pushEvent(controller: ReadableStreamDefaultController<Uint8Array>, payload: unknown) {
  const data = JSON.stringify({ data: payload });
  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
}

export async function GET(request: NextRequest, context: HandlerContext) {
  const { dashboard, parameterId } = await context.params;
  const dashboardName = decodeParam(dashboard);
  const id = decodeParam(parameterId);
  const url = new URL(request.url);
  const displayType = parseDisplayType(url.searchParams.get('displayType'));
  const parameterName = parseOptionalName(url.searchParams.get('name'));

  try {
    const initial = await getParameterData(dashboardName, { id, name: parameterName, displayType });

    if (initial === null) {
      return new Response('Parameter not found.', { status: 404 });
    }

    let cleanup: (() => void) | null = null;
    let lastSerialized = JSON.stringify(initial);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        pushEvent(controller, initial);

        let pollTimer: ReturnType<typeof setInterval> | null = null;
        let isPolling = false;

        const poll = async () => {
          if (isPolling) {
            return;
          }
          isPolling = true;
          try {
            const next = await getParameterData(dashboardName, {
              id,
              name: parameterName,
              displayType,
            });

            if (next === null) {
              return;
            }

            const serialized = JSON.stringify(next);
            if (serialized !== lastSerialized) {
              lastSerialized = serialized;
              pushEvent(controller, next);
            }
          } catch (error) {
            console.error(`Failed to poll parameter ${dashboardName}/${id}:`, error);
          } finally {
            isPolling = false;
          }
        };

        pollTimer = setInterval(() => {
          poll().catch((error) => {
            console.error(`Unhandled error while polling ${dashboardName}/${id}:`, error);
          });
        }, POLL_INTERVAL_MS);

        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(':keep-alive\n\n'));
        }, 15000);

        cleanup = () => {
          const handler = cleanup;
          cleanup = null;
          if (pollTimer) {
            clearInterval(pollTimer);
          }
          clearInterval(keepAlive);
          controller.close();
          if (handler) {
            request.signal.removeEventListener('abort', handler);
          }
        };

        request.signal.addEventListener('abort', cleanup);
        // Trigger an immediate poll to capture any updates that occurred between the
        // initial read and establishing the stream.
        poll().catch((error) => {
          console.error(`Unhandled error while polling ${dashboardName}/${id}:`, error);
        });
      },
      cancel() {
        if (cleanup) {
          cleanup();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error(`Failed to start parameter stream for ${dashboardName}/${id}:`, error);
    return new Response('Unable to start stream.', { status: 500 });
  }
}

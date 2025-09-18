import { NextRequest } from 'next/server';

import { getParameterData, maybeSimulateParameter } from '@/lib/parameter-data';
import type { Parameter } from '@/lib/types';
import { subscribeToParameter } from '@/lib/realtime';

const encoder = new TextEncoder();
const STREAM_SIMULATION_INTERVAL_MS = Number(process.env.PARAMETER_STREAM_SIMULATION_INTERVAL_MS ?? '2500');
const SIMULATION_ENABLED = process.env.PARAMETER_DATA_SIMULATION !== 'off';

type RouteParams = { dashboard: string; parameterId: string };

type HandlerContext = { params: Promise<RouteParams> };

function decodeParam(value: string): string {
  return decodeURIComponent(value);
}

function parseDisplayType(raw: string | null): Parameter['displayType'] | undefined {
  if (!raw) {
    return undefined;
  }
  return raw as Parameter['displayType'];
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

  try {
    const initial = await getParameterData(
      dashboardName,
      { id, displayType },
      { initialize: !!displayType },
    );

    if (initial === null) {
      return new Response('Parameter not found.', { status: 404 });
    }

    let cleanup: (() => void) | null = null;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        pushEvent(controller, initial);

        const unsubscribe = subscribeToParameter(dashboardName, id, (update) => {
          pushEvent(controller, update.data);
        });

        let interval: ReturnType<typeof setInterval> | null = null;

        if (SIMULATION_ENABLED) {
          interval = setInterval(() => {
            maybeSimulateParameter(dashboardName, { id, displayType }).catch((error) => {
              console.error(
                `Failed to advance simulated data for ${dashboardName}/${id}:`,
                error,
              );
            });
          }, STREAM_SIMULATION_INTERVAL_MS);
        }

        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(':keep-alive\n\n'));
        }, 15000);

        cleanup = () => {
          const handler = cleanup;
          cleanup = null;
          unsubscribe();
          if (interval) {
            clearInterval(interval);
          }
          clearInterval(keepAlive);
          controller.close();
          if (handler) {
            request.signal.removeEventListener('abort', handler);
          }
        };

        request.signal.addEventListener('abort', cleanup);
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

import { NextRequest, NextResponse } from 'next/server';

import { getParameterData, recordParameterValue } from '@/lib/parameter-data';
import type { Parameter } from '@/lib/types';

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

export async function GET(request: NextRequest, context: HandlerContext) {
  const { dashboard, parameterId } = await context.params;
  const dashboardName = decodeParam(dashboard);
  const id = decodeParam(parameterId);
  const url = new URL(request.url);
  const displayType = parseDisplayType(url.searchParams.get('displayType'));
  const rawValueKey = url.searchParams.get('valueKey');
  const valueKey = rawValueKey && rawValueKey.trim() ? rawValueKey : undefined;

  try {
    const data = await getParameterData(dashboardName, {
      id,
      displayType,
      valueKey,
    });

    if (data === null || data === undefined) {
      return NextResponse.json({ error: 'Parameter not found.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error(`Failed to load parameter ${id} for ${dashboardName}:`, error);
    return NextResponse.json({ error: 'Unable to load parameter data.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: HandlerContext) {
  const { dashboard, parameterId } = await context.params;
  const dashboardName = decodeParam(dashboard);
  const id = decodeParam(parameterId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};

  const value = typeof payload.value === 'number' ? payload.value : Number(payload.value);
  if (!Number.isFinite(value)) {
    return NextResponse.json({ error: 'A numeric "value" field is required.' }, { status: 400 });
  }

  const displayType = parseDisplayType(
    (typeof payload.displayType === 'string' ? payload.displayType : null) ?? null,
  );
  const timestampValue = payload.timestamp;
  const providedValueKey = typeof payload.valueKey === 'string' ? payload.valueKey : undefined;
  const valueKey = providedValueKey && providedValueKey.trim() ? providedValueKey : undefined;
  let timestamp: Date | undefined;

  if (timestampValue !== undefined) {
    const candidate =
      timestampValue instanceof Date
        ? timestampValue
        : typeof timestampValue === 'string' || typeof timestampValue === 'number'
          ? new Date(timestampValue)
          : null;

    if (!candidate || Number.isNaN(candidate.getTime())) {
      return NextResponse.json({ error: 'Invalid timestamp.' }, { status: 400 });
    }

    timestamp = candidate;
  }

  try {
    const data = await recordParameterValue(
      dashboardName,
      { id, displayType, valueKey },
      value,
      timestamp,
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Unable to update parameter value.';
    console.error(`Failed to update parameter ${id} for ${dashboardName}:`, error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

import { getParameterData } from '@/lib/parameter-data';
import type { Parameter } from '@/lib/types';

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

export async function GET(request: NextRequest, context: HandlerContext) {
  const { dashboard, parameterId } = await context.params;
  const dashboardName = decodeParam(dashboard);
  const id = decodeParam(parameterId);
  const url = new URL(request.url);
  const displayType = parseDisplayType(url.searchParams.get('displayType'));
  const parameterName = parseOptionalName(url.searchParams.get('name'));

  try {
    const data = await getParameterData(dashboardName, {
      id,
      name: parameterName,
      displayType,
    });

    if (data === null) {
      return NextResponse.json({ error: 'Parameter not found.' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error(`Failed to load parameter ${id} for ${dashboardName}:`, error);
    return NextResponse.json({ error: 'Unable to load parameter data.' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Parameters are read-only. Update the MongoDB collection to change their values.' },
    { status: 405, headers: { Allow: 'GET' } },
  );
}

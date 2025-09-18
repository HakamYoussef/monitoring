'use server';

import { maybeSimulateParameter } from '@/lib/parameter-data';
import type { Parameter } from '@/lib/types';

type ParameterDescriptor = Pick<Parameter, 'id' | 'displayType'>;

/**
 * Fetches the latest data for a given parameter on the specified dashboard.
 * When MongoDB is configured, the value is persisted so multiple clients and
 * subsequent sessions see the same readings. In development, values are
 * simulated to provide live updates.
 */
export async function getLatestParameterData(
  dashboardName: string,
  parameter: ParameterDescriptor,
): Promise<unknown> {
  try {
    const payload = await maybeSimulateParameter(dashboardName, {
      id: parameter.id,
      displayType: parameter.displayType,
    });
    return payload;
  } catch (error) {
    console.error(`Failed to fetch data for parameter ${parameter.id}:`, error);
    return null;
  }
}

'use server';

import { getParameterData } from '@/lib/parameter-data';
import type { Parameter } from '@/lib/types';

type ParameterDescriptor = Pick<Parameter, 'id' | 'displayType'> & {
  valueKey?: string;
};

/**
 * Fetches the latest data for a given parameter on the specified dashboard.
 * When MongoDB is configured, the value is persisted so multiple clients and
 * subsequent sessions see the same readings.
 */
export async function getLatestParameterData(
  dashboardName: string,
  parameter: ParameterDescriptor,
): Promise<unknown> {
  try {
    // Ensure the identifier aligns with the server default when no override is provided.
    const valueKey = parameter.valueKey?.trim() || parameter.id;
    const payload = await getParameterData(dashboardName, {
      id: parameter.id,
      displayType: parameter.displayType,
      valueKey,
    });
    return payload;
  } catch (error) {
    console.error(`Failed to fetch data for parameter ${parameter.id}:`, error);
    return null;
  }
}

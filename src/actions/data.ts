'use server';

import { getParameterData } from '@/lib/parameter-data';
import type { Parameter } from '@/lib/types';

/**
 * Fetches the latest data for a given parameter on the specified dashboard.
 * Data is read directly from the dashboard's MongoDB collection. If the
 * database is unavailable or no data exists yet, the caller receives `null`.
 */
export async function getLatestParameterData(
  dashboardName: string,
  parameter: Parameter,
): Promise<unknown> {
  try {
    const payload = await getParameterData(dashboardName, {
      id: parameter.id,
      name: parameter.name,
      displayType: parameter.displayType,
    });
    return payload;
  } catch (error) {
    console.error(`Failed to fetch data for parameter ${parameter.id}:`, error);
    return null;
  }
}

import type { Collection } from 'mongodb';

import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import type { Parameter } from '@/lib/types';
import { emitParameterUpdate } from '@/lib/realtime';

type ParameterDisplayType = Parameter['displayType'];

type ParameterSeriesEntry = {
  timestamp: Date;
  value: number;
};

type ParameterDataRecord = {
  dashboard: string;
  parameterId: string;
  displayType: ParameterDisplayType;
  value: number;
  previousValue: number;
  series: ParameterSeriesEntry[];
  updatedAt: Date;
};

type ParameterDescriptor = {
  id: string;
  displayType?: ParameterDisplayType;
};

type EnsureOptions = {
  initialize: boolean;
};

const PARAMETER_COLLECTION = 'dashboardParameters';
const MAX_SERIES_LENGTH = 20;
const DEFAULT_MIN = 5;
const DEFAULT_MAX = 95;

const memoryStore = new Map<string, ParameterDataRecord>();

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function getMemoryKey(dashboard: string, parameterId: string): string {
  return `${dashboard}::${parameterId}`;
}

function cloneSeries(series: ParameterSeriesEntry[]): ParameterSeriesEntry[] {
  return series.map((entry) => ({ timestamp: new Date(entry.timestamp), value: entry.value }));
}

async function getParameterCollection(): Promise<Collection<ParameterDataRecord> | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  try {
    return await getCollection<ParameterDataRecord>(PARAMETER_COLLECTION);
  } catch (error) {
    console.error('Failed to access MongoDB parameter collection:', error);
    return null;
  }
}

function ensurePreviousValue(record: ParameterDataRecord, fallback: number): number {
  return Number.isFinite(record.previousValue) ? record.previousValue : fallback;
}

function createInitialRecord(
  dashboard: string,
  descriptor: Required<ParameterDescriptor>,
): ParameterDataRecord {
  const now = new Date();
  const baseValue = randomBetween(DEFAULT_MIN, DEFAULT_MAX);

  if (descriptor.displayType === 'line' || descriptor.displayType === 'bar') {
    const series: ParameterSeriesEntry[] = [];
    let runningValue = baseValue;

    for (let index = MAX_SERIES_LENGTH - 1; index >= 0; index -= 1) {
      runningValue = clamp(runningValue + (Math.random() - 0.5) * 6, 0, 100);
      series.unshift({
        timestamp: new Date(now.getTime() - index * 1000),
        value: runningValue,
      });
    }

    const currentValue = series[series.length - 1]?.value ?? baseValue;

    return {
      dashboard,
      parameterId: descriptor.id,
      displayType: descriptor.displayType,
      value: currentValue,
      previousValue: currentValue,
      series,
      updatedAt: now,
    };
  }

  return {
    dashboard,
    parameterId: descriptor.id,
    displayType: descriptor.displayType,
    value: baseValue,
    previousValue: baseValue,
    series: [],
    updatedAt: now,
  };
}

function normalizeRecord(raw: ParameterDataRecord): ParameterDataRecord {
  return {
    dashboard: raw.dashboard,
    parameterId: raw.parameterId,
    displayType: raw.displayType,
    value: Number.isFinite(raw.value) ? raw.value : 0,
    previousValue: Number.isFinite(raw.previousValue) ? raw.previousValue : raw.value ?? 0,
    series: Array.isArray(raw.series)
      ? raw.series.map((entry) => ({
          timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp),
          value: Number.isFinite(entry.value) ? entry.value : 0,
        }))
      : [],
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt : new Date(raw.updatedAt),
  };
}

async function loadRecord(dashboard: string, parameterId: string): Promise<ParameterDataRecord | null> {
  const collection = await getParameterCollection();

  if (collection) {
    const document = await collection.findOne({ dashboard, parameterId });
    if (document) {
      return normalizeRecord(document);
    }
  }

  const memoryRecord = memoryStore.get(getMemoryKey(dashboard, parameterId));
  return memoryRecord ? normalizeRecord(memoryRecord) : null;
}

async function persistRecord(record: ParameterDataRecord): Promise<void> {
  const key = getMemoryKey(record.dashboard, record.parameterId);
  memoryStore.set(key, normalizeRecord(record));

  const collection = await getParameterCollection();
  if (!collection) {
    return;
  }

  try {
    await collection.updateOne(
      { dashboard: record.dashboard, parameterId: record.parameterId },
      {
        $set: {
          displayType: record.displayType,
          value: record.value,
          previousValue: record.previousValue,
          series: record.series,
          updatedAt: record.updatedAt,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error(`Failed to persist parameter ${record.parameterId} for ${record.dashboard}:`, error);
  }
}

async function ensureRecord(
  dashboard: string,
  descriptor: ParameterDescriptor,
  options: EnsureOptions,
): Promise<ParameterDataRecord | null> {
  const existing = await loadRecord(dashboard, descriptor.id);
  if (existing) {
    return existing;
  }

  if (!options.initialize) {
    return null;
  }

  if (!descriptor.displayType) {
    throw new Error('Display type is required to initialize parameter data.');
  }

  const created = createInitialRecord(dashboard, descriptor as Required<ParameterDescriptor>);
  await persistRecord(created);
  return created;
}

function applySimulationStep(record: ParameterDataRecord): ParameterDataRecord {
  const next: ParameterDataRecord = {
    ...record,
    series: cloneSeries(record.series),
    previousValue: ensurePreviousValue(record, record.value),
    updatedAt: new Date(),
  };

  const baseValue = Number.isFinite(record.value) ? record.value : 50;

  switch (record.displayType) {
    case 'line':
    case 'bar': {
      const lastValue = next.series[next.series.length - 1]?.value ?? baseValue;
      const mutated = clamp(lastValue + (Math.random() - 0.5) * 6, 0, 100);
      next.value = mutated;
      next.previousValue = lastValue;
      next.series.push({ timestamp: next.updatedAt, value: mutated });
      if (next.series.length > MAX_SERIES_LENGTH) {
        next.series = next.series.slice(-MAX_SERIES_LENGTH);
      }
      break;
    }
    case 'stat': {
      const mutated = clamp(baseValue + (Math.random() - 0.5) * 10, 0, 100);
      next.previousValue = baseValue;
      next.value = mutated;
      break;
    }
    default: {
      const mutated = clamp(baseValue + (Math.random() - 0.5) * 10, 0, 100);
      next.previousValue = baseValue;
      next.value = mutated;
      break;
    }
  }

  return next;
}

function applyExternalValue(
  record: ParameterDataRecord,
  value: number,
  timestamp: Date,
): ParameterDataRecord {
  const normalizedValue = clamp(value, 0, 100);

  const next: ParameterDataRecord = {
    ...record,
    series: cloneSeries(record.series),
    previousValue: ensurePreviousValue(record, record.value),
    value: normalizedValue,
    updatedAt: timestamp,
  };

  switch (record.displayType) {
    case 'line':
    case 'bar': {
      next.series.push({ timestamp, value: normalizedValue });
      if (next.series.length > MAX_SERIES_LENGTH) {
        next.series = next.series.slice(-MAX_SERIES_LENGTH);
      }
      next.previousValue = record.series.at(-1)?.value ?? record.value ?? normalizedValue;
      break;
    }
    case 'stat': {
      next.previousValue = record.value ?? normalizedValue;
      break;
    }
    default: {
      next.previousValue = record.value ?? normalizedValue;
    }
  }

  return next;
}

function toResponsePayload(record: ParameterDataRecord): unknown {
  switch (record.displayType) {
    case 'line':
      return record.series.map((entry) => ({
        time: entry.timestamp.getTime(),
        value: entry.value,
      }));
    case 'bar':
      return record.series.map((entry, index) => ({
        name: `Point ${index + 1}`,
        value: entry.value,
      }));
    case 'stat':
      return {
        value: record.value,
        previousValue: ensurePreviousValue(record, record.value),
      };
    default:
      return record.value;
  }
}

export async function getParameterData(
  dashboard: string,
  descriptor: ParameterDescriptor,
  options: Partial<EnsureOptions> = { initialize: true },
): Promise<unknown | null> {
  const record = await ensureRecord(dashboard, descriptor, {
    initialize: options.initialize ?? true,
  });

  if (!record) {
    return null;
  }

  return toResponsePayload(record);
}

const SIMULATION_ENABLED = process.env.PARAMETER_DATA_SIMULATION !== 'off';

export async function stepParameterSimulation(
  dashboard: string,
  descriptor: ParameterDescriptor,
): Promise<unknown | null> {
  const record = await ensureRecord(dashboard, descriptor, { initialize: true });
  if (!record) {
    return null;
  }

  const nextRecord = applySimulationStep(record);
  await persistRecord(nextRecord);

  const payload = toResponsePayload(nextRecord);
  emitParameterUpdate({ dashboard, parameterId: descriptor.id, data: payload });

  return payload;
}

export async function maybeSimulateParameter(
  dashboard: string,
  descriptor: ParameterDescriptor,
): Promise<unknown | null> {
  if (!SIMULATION_ENABLED) {
    return getParameterData(dashboard, descriptor, { initialize: true });
  }

  return stepParameterSimulation(dashboard, descriptor);
}

export async function recordParameterValue(
  dashboard: string,
  descriptor: ParameterDescriptor,
  value: number,
  timestamp: Date = new Date(),
): Promise<unknown> {
  const record = await ensureRecord(dashboard, descriptor, { initialize: !!descriptor.displayType });
  if (!record) {
    throw new Error('Parameter record does not exist. Provide a display type to initialize it.');
  }

  const nextRecord = applyExternalValue(record, value, timestamp);
  await persistRecord(nextRecord);

  const payload = toResponsePayload(nextRecord);
  emitParameterUpdate({ dashboard, parameterId: descriptor.id, data: payload });

  return payload;
}

import type { Collection, Document } from 'mongodb';
import { ObjectId } from 'mongodb';

import { getParameterCollectionName } from '@/lib/collection-names';
import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import type { Parameter } from '@/lib/types';
import { emitParameterUpdate } from '@/lib/realtime';

type ParameterDisplayType = Parameter['displayType'];

type ParameterDescriptor = {
  id: string;
  displayType?: ParameterDisplayType;
  valueKey?: string;
};

type ParameterDocument = Document & {
  timestamp?: Date | string | number;
  createdAt?: Date | string | number;
  updatedAt?: Date | string | number;
  [key: string]: unknown;
};

const DEFAULT_LINE_HISTORY = 50;
const DEFAULT_STAT_HISTORY = 2;

async function getParameterCollection(
  dashboard: string,
): Promise<Collection<ParameterDocument> | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  try {
    const collectionName = getParameterCollectionName(dashboard);
    return await getCollection<ParameterDocument>(collectionName);
  } catch (error) {
    console.error('Failed to access parameter collection:', error);
    return null;
  }
}

function determineHistoryLength(displayType?: ParameterDisplayType): number {
  switch (displayType) {
    case 'line':
      return DEFAULT_LINE_HISTORY;
    case 'stat':
      return DEFAULT_STAT_HISTORY;
    default:
      return 1;
  }
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  return null;
}

function coerceTimestamp(value: unknown): number | null {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
    }

    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getDocumentTimestamp(document: ParameterDocument, fallback: number): number {
  const timestampFields: Array<Date | string | number | undefined> = [
    document.timestamp,
    document.updatedAt,
    document.createdAt,
  ];

  for (const field of timestampFields) {
    const resolved = coerceTimestamp(field);
    if (resolved !== null) {
      return resolved;
    }
  }

  const identifier = document._id;
  if (identifier instanceof ObjectId) {
    try {
      return identifier.getTimestamp().getTime();
    } catch (error) {
      console.warn('Unable to derive timestamp from ObjectId:', error);
    }
  }

  return fallback;
}

function toLineSeries(documents: ParameterDocument[], key: string): Array<{ time: number; value: number }> {
  if (documents.length === 0) {
    return [];
  }

  const chronological = [...documents].reverse();
  const fallbackStart = Date.now() - chronological.length * 1000;
  const result: Array<{ time: number; value: number }> = [];
  let lastTime = 0;

  chronological.forEach((document, index) => {
    const numeric = coerceNumber(document[key]);
    if (numeric === null) {
      return;
    }

    const fallbackTime = fallbackStart + index * 1000;
    const timestamp = getDocumentTimestamp(document, fallbackTime);
    const normalizedTime = Math.max(timestamp, lastTime + 1);
    result.push({ time: normalizedTime, value: numeric });
    lastTime = normalizedTime;
  });

  return result;
}

function toBarSeries(rawValue: unknown, key: string): Array<{ name: string; value: number }> {
  if (Array.isArray(rawValue)) {
    const result: Array<{ name: string; value: number }> = [];

    rawValue.forEach((entry, index) => {
      if (entry && typeof entry === 'object') {
        const objectEntry = entry as Record<string, unknown>;
        const numeric = coerceNumber(objectEntry.value ?? objectEntry.amount ?? objectEntry.count);
        if (numeric === null) {
          return;
        }
        const labelValue = objectEntry.name ?? objectEntry.label ?? `Item ${index + 1}`;
        const label = typeof labelValue === 'string' && labelValue.trim() ? labelValue : `Item ${index + 1}`;
        result.push({ name: label, value: numeric });
      } else {
        const numeric = coerceNumber(entry);
        if (numeric === null) {
          return;
        }
        result.push({ name: `Item ${index + 1}`, value: numeric });
      }
    });

    return result;
  }

  if (rawValue && typeof rawValue === 'object') {
    const entries = Object.entries(rawValue as Record<string, unknown>);
    const result: Array<{ name: string; value: number }> = [];

    for (const [label, entryValue] of entries) {
      const numeric = coerceNumber(entryValue);
      if (numeric !== null) {
        result.push({ name: label, value: numeric });
      }
    }

    return result;
  }

  const numeric = coerceNumber(rawValue);
  if (numeric === null) {
    return [];
  }

  return [{ name: key, value: numeric }];
}

function toNumericValue(document: ParameterDocument | undefined, key: string): number | null {
  if (!document) {
    return null;
  }

  return coerceNumber(document[key]);
}

function toStatPayload(
  documents: ParameterDocument[],
  key: string,
): { value: number; previousValue: number } | null {
  if (documents.length === 0) {
    return null;
  }

  const current = coerceNumber(documents[0]?.[key]);
  if (current === null) {
    return null;
  }

  const previous = coerceNumber(documents[1]?.[key]);
  return {
    value: current,
    previousValue: previous ?? current,
  };
}

function buildPayload(
  displayType: ParameterDisplayType | undefined,
  documents: ParameterDocument[],
  key: string,
): unknown | null {
  switch (displayType) {
    case 'line':
      return toLineSeries(documents, key);
    case 'bar': {
      const latest = documents[0];
      if (!latest) {
        return [];
      }
      return toBarSeries(latest[key], key);
    }
    case 'stat':
      return toStatPayload(documents, key);
    case 'radial-gauge':
    case 'progress':
    case 'linear-gauge':
    case 'status-light':
    default: {
      const numeric = toNumericValue(documents[0], key);
      return numeric;
    }
  }
}

export async function getParameterData(
  dashboard: string,
  descriptor: ParameterDescriptor,
): Promise<unknown | null> {
  const key = descriptor.valueKey?.trim() || descriptor.id;
  if (!key) {
    return null;
  }

  const collection = await getParameterCollection(dashboard);
  if (!collection) {
    return null;
  }

  try {
    const historyLength = determineHistoryLength(descriptor.displayType);
    const documents = await collection
      .find({}, { sort: { timestamp: -1, createdAt: -1, _id: -1 }, limit: historyLength })
      .toArray();

    if (documents.length === 0) {
      return null;
    }

    const payload = buildPayload(descriptor.displayType, documents, key);
    return payload ?? null;
  } catch (error) {
    console.error(`Failed to load parameter data for ${dashboard}/${key}:`, error);
    return null;
  }
}

export async function recordParameterValue(
  dashboard: string,
  descriptor: ParameterDescriptor,
  value: number,
  timestamp: Date = new Date(),
): Promise<unknown> {
  const key = descriptor.valueKey?.trim() || descriptor.id;
  if (!key) {
    throw new Error('A parameter identifier is required to record a value.');
  }

  const collection = await getParameterCollection(dashboard);
  if (!collection) {
    throw new Error('MongoDB is not configured or unavailable.');
  }

  const document: ParameterDocument = {
    timestamp,
    [key]: value,
  };

  try {
    await collection.insertOne(document);
  } catch (error) {
    console.error(`Failed to record parameter value for ${dashboard}/${key}:`, error);
    throw new Error('Unable to store the parameter value.');
  }

  const payload = await getParameterData(dashboard, descriptor);
  if (payload !== null) {
    emitParameterUpdate({ dashboard, parameterId: descriptor.id, data: payload });
  }

  return payload;
}

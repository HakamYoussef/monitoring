import type { Collection, Document } from 'mongodb';
import { ObjectId } from 'mongodb';

import { getParameterCollectionName, getParameterFieldCandidates } from '@/lib/dashboard-storage';
import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import type { Parameter } from '@/lib/types';

export type ParameterDescriptor = {
  id: Parameter['id'];
  displayType: Parameter['displayType'];
  name?: Parameter['name'];
};

export type GetParameterDataOptions = {
  historyLimit?: number;
};

type ParameterSnapshot = {
  timestamp: Date;
  value: number;
};

interface ParameterDocument extends Document {
  _id: ObjectId;
  createdAt?: Date;
  timestamp?: Date;
  [key: string]: unknown;
}

const DEFAULT_HISTORY_LIMIT = 20;
const FALLBACK_HISTORY_LIMIT = DEFAULT_HISTORY_LIMIT * 2;

const snapshotCache = new Map<string, ParameterSnapshot[]>();

function getCacheKey(dashboard: string, descriptor: ParameterDescriptor): string {
  return `${dashboard}::${descriptor.id}`;
}

function toFiniteNumber(value: unknown): number | null {
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

  return null;
}

function resolveTimestamp(document: ParameterDocument): Date {
  if (document.timestamp instanceof Date) {
    return document.timestamp;
  }
  if (document.createdAt instanceof Date) {
    return document.createdAt;
  }
  if (document._id instanceof ObjectId) {
    return document._id.getTimestamp();
  }
  return new Date();
}

function extractValue(document: ParameterDocument, descriptor: ParameterDescriptor): number | null {
  const candidates = getParameterFieldCandidates({ id: descriptor.id, name: descriptor.name });

  for (const key of candidates) {
    if (!Object.prototype.hasOwnProperty.call(document, key)) {
      continue;
    }
    const numeric = toFiniteNumber(document[key as keyof ParameterDocument]);
    if (numeric !== null) {
      return numeric;
    }
  }

  return null;
}

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
    console.error(`Failed to access MongoDB parameter collection for ${dashboard}:`, error);
    return null;
  }
}

async function fetchSnapshotsFromDatabase(
  dashboard: string,
  descriptor: ParameterDescriptor,
  limit: number,
): Promise<ParameterSnapshot[]> {
  const collection = await getParameterCollection(dashboard);
  if (!collection) {
    return [];
  }

  try {
    const documents = await collection
      .find({}, { sort: { _id: -1 }, limit: Math.max(limit * 3, limit) })
      .toArray();

    const snapshots: ParameterSnapshot[] = [];

    for (const document of documents) {
      const value = extractValue(document, descriptor);
      if (value === null) {
        continue;
      }

      snapshots.push({ timestamp: resolveTimestamp(document), value });
      if (snapshots.length >= limit) {
        break;
      }
    }

    return snapshots.reverse();
  } catch (error) {
    console.error(`Failed to load parameter data for ${dashboard}/${descriptor.id}:`, error);
    return [];
  }
}

function readCachedSnapshots(
  dashboard: string,
  descriptor: ParameterDescriptor,
  limit: number,
): ParameterSnapshot[] | null {
  const cached = snapshotCache.get(getCacheKey(dashboard, descriptor));
  if (!cached || cached.length === 0) {
    return null;
  }
  return cached.slice(-limit);
}

function writeCachedSnapshots(
  dashboard: string,
  descriptor: ParameterDescriptor,
  snapshots: ParameterSnapshot[],
): void {
  snapshotCache.set(getCacheKey(dashboard, descriptor), snapshots.slice(-FALLBACK_HISTORY_LIMIT));
}

function toLineSeries(snapshots: ParameterSnapshot[]): Array<{ time: number; value: number }> {
  return snapshots.map((snapshot) => ({
    time: snapshot.timestamp.getTime(),
    value: snapshot.value,
  }));
}

function toBarSeries(snapshots: ParameterSnapshot[]): Array<{ name: string; value: number }> {
  return snapshots.map((snapshot, index) => ({
    name: `Point ${index + 1}`,
    value: snapshot.value,
  }));
}

function toStatPayload(snapshots: ParameterSnapshot[]): { value: number; previousValue: number } {
  const latest = snapshots.at(-1);
  const previous = snapshots.at(-2) ?? latest;
  const latestValue = latest?.value ?? 0;
  const previousValue = previous?.value ?? latestValue;
  return { value: latestValue, previousValue };
}

function getLatestValue(snapshots: ParameterSnapshot[]): number | null {
  const latest = snapshots.at(-1);
  return latest ? latest.value : null;
}

export async function getParameterData(
  dashboard: string,
  descriptor: ParameterDescriptor,
  options: GetParameterDataOptions = {},
): Promise<unknown | null> {
  const limit = Math.max(1, options.historyLimit ?? DEFAULT_HISTORY_LIMIT);

  const snapshotsFromDb = await fetchSnapshotsFromDatabase(dashboard, descriptor, limit);
  if (snapshotsFromDb.length > 0) {
    writeCachedSnapshots(dashboard, descriptor, snapshotsFromDb);
  }

  const snapshots =
    snapshotsFromDb.length > 0
      ? snapshotsFromDb
      : readCachedSnapshots(dashboard, descriptor, limit) ?? [];

  if (snapshots.length === 0) {
    return null;
  }

  switch (descriptor.displayType) {
    case 'line':
      return toLineSeries(snapshots);
    case 'bar':
      return toBarSeries(snapshots);
    case 'stat':
      return toStatPayload(snapshots);
    default:
      return getLatestValue(snapshots);
  }
}

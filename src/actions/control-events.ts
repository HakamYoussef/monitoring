'use server';

import { Collection } from 'mongodb';

import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import type { Control } from '@/lib/types';

const CONTROL_STATE_COLLECTION = 'controlStates';

type ControlType = Control['type'];

export type SetControlStateInput = {
  dashboardName: string;
  controlId: string;
  type: ControlType;
  value: unknown;
};

export type ControlStateSnapshot = {
  controlId: string;
  type: ControlType;
  value: unknown;
  updatedAt: string;
  lastError?: string;
};

export type SetControlStateResult = {
  success: boolean;
  state?: ControlStateSnapshot;
  error?: string;
};

interface ControlStateDocument {
  dashboard: string;
  controlId: string;
  type: ControlType;
  value: unknown;
  updatedAt: Date;
  lastError?: string | null;
}

type ControlStateRecord = {
  dashboard: string;
  controlId: string;
  type: ControlType;
  value: unknown;
  updatedAt: Date;
  lastError?: string;
};

type IntegrationResult = {
  success: boolean;
  value?: unknown;
  message?: string;
};

type ControlStateStore = typeof globalThis & {
  __controlStateStore?: Map<string, ControlStateRecord>;
};

const globalStore = globalThis as ControlStateStore;

const inMemoryStore =
  globalStore.__controlStateStore ?? (globalStore.__controlStateStore = new Map<string, ControlStateRecord>());

function getStoreKey(dashboard: string, controlId: string): string {
  return `${dashboard}::${controlId}`;
}

async function getControlStateCollection(): Promise<Collection<ControlStateDocument> | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  try {
    return await getCollection<ControlStateDocument>(CONTROL_STATE_COLLECTION);
  } catch (error) {
    console.error('Failed to access MongoDB control state collection:', error);
    return null;
  }
}

function toRecord(document: ControlStateDocument): ControlStateRecord {
  return {
    dashboard: document.dashboard,
    controlId: document.controlId,
    type: document.type,
    value: document.value,
    updatedAt: document.updatedAt instanceof Date ? document.updatedAt : new Date(document.updatedAt),
    lastError: document.lastError ?? undefined,
  };
}

function toSnapshot(record: ControlStateRecord): ControlStateSnapshot {
  return {
    controlId: record.controlId,
    type: record.type,
    value: record.value,
    updatedAt: record.updatedAt.toISOString(),
    lastError: record.lastError,
  };
}

async function persistControlState(record: ControlStateRecord): Promise<void> {
  const collection = await getControlStateCollection();
  if (collection) {
    try {
      await collection.updateOne(
        { dashboard: record.dashboard, controlId: record.controlId },
        {
          $set: {
            type: record.type,
            value: record.value,
            updatedAt: record.updatedAt,
            lastError: record.lastError ?? null,
          },
        },
        { upsert: true },
      );
    } catch (error) {
      console.error(
        `Failed to persist control state to MongoDB for ${record.dashboard}/${record.controlId}:`,
        error,
      );
    }
  }

  inMemoryStore.set(getStoreKey(record.dashboard, record.controlId), record);
}

function normalizeError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

async function relayToArduino(input: SetControlStateInput): Promise<IntegrationResult> {
  const endpoint = process.env.ARDUINO_CONTROL_ENDPOINT;
  if (!endpoint) {
    // No external integration configured. Treat as a successful no-op.
    return { success: true, value: input.value };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const rawText = await response.text();
    let parsed: unknown = null;

    if (rawText) {
      try {
        parsed = JSON.parse(rawText);
      } catch (parseError) {
        console.warn('Received non-JSON response from Arduino endpoint:', parseError);
      }
    }

    if (!response.ok) {
      const parsedObject = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
      const message =
        parsedObject && typeof parsedObject.error === 'string'
          ? parsedObject.error
          : `Request failed with status ${response.status}`;
      console.error(`Arduino endpoint responded with status ${response.status}:`, message);
      return {
        success: false,
        value: parsedObject && 'value' in parsedObject ? parsedObject.value : undefined,
        message,
      };
    }

    const parsedObject = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
    const resolvedValue =
      parsedObject && 'value' in parsedObject
        ? parsedObject.value
        : parsedObject && 'state' in parsedObject
          ? parsedObject.state
          : parsed ?? input.value;
    return { success: true, value: resolvedValue };
  } catch (error) {
    const message = normalizeError(error, 'Unable to reach the Arduino endpoint.');
    console.error('Failed to relay control state to Arduino:', error);
    return { success: false, message };
  }
}

export async function getControlStates(
  dashboardName: string,
  controlIds: string[],
): Promise<Record<string, ControlStateSnapshot>> {
  if (!Array.isArray(controlIds) || controlIds.length === 0) {
    return {};
  }

  const result: Record<string, ControlStateSnapshot> = {};
  const collection = await getControlStateCollection();

  if (collection) {
    try {
      const documents = await collection
        .find({ dashboard: dashboardName, controlId: { $in: controlIds } })
        .toArray();
      for (const document of documents) {
        const record = toRecord(document);
        inMemoryStore.set(getStoreKey(record.dashboard, record.controlId), record);
        result[record.controlId] = toSnapshot(record);
      }
    } catch (error) {
      console.error('Failed to load control states from MongoDB:', error);
    }
  }

  for (const id of controlIds) {
    if (!result[id]) {
      const record = inMemoryStore.get(getStoreKey(dashboardName, id));
      if (record) {
        result[id] = toSnapshot(record);
      }
    }
  }

  return result;
}

export async function setControlState(input: SetControlStateInput): Promise<SetControlStateResult> {
  if (!input.dashboardName) {
    const message = 'A dashboard name is required to update control state.';
    console.error(message, input);
    return { success: false, error: message };
  }

  if (!input.controlId) {
    const message = 'A controlId is required to update control state.';
    console.error(message, input);
    return { success: false, error: message };
  }

  if (!input.type) {
    const message = 'A control type is required to update control state.';
    console.error(message, input);
    return { success: false, error: message };
  }

  try {
    const integration = await relayToArduino(input);
    const record: ControlStateRecord = {
      dashboard: input.dashboardName,
      controlId: input.controlId,
      type: input.type,
      value: integration.value ?? input.value,
      updatedAt: new Date(),
      lastError: integration.success ? undefined : integration.message,
    };

    await persistControlState(record);
    const snapshot = toSnapshot(record);

    if (!integration.success) {
      return {
        success: false,
        state: snapshot,
        error: integration.message ?? 'Device failed to acknowledge the update.',
      };
    }

    return {
      success: true,
      state: snapshot,
    };
  } catch (error) {
    const message = normalizeError(error, 'Unexpected failure while updating the control.');
    console.error(
      `Unhandled error while setting control state for ${input.dashboardName}/${input.controlId}:`,
      error,
    );

    const record: ControlStateRecord = {
      dashboard: input.dashboardName,
      controlId: input.controlId,
      type: input.type,
      value: input.value,
      updatedAt: new Date(),
      lastError: message,
    };

    await persistControlState(record);

    return {
      success: false,
      state: toSnapshot(record),
      error: message,
    };
  }
}

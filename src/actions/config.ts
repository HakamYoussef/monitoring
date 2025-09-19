'use server';

import type { Collection, Document } from 'mongodb';
import { notFound } from 'next/navigation';

import {
  getConfigControlCollectionName,
  getConfigParameterCollectionName,
} from '@/lib/collection-names';
import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import { Config, ConfigSchema, Control, Parameter } from '@/lib/types';

type ParameterDocument = Parameter & { order?: number };
type ControlDocument = Control & { order?: number };

function sanitizeDocumentKey(
  rawValue: string | undefined,
  fallback: string,
  usedKeys: Set<string>,
): string {
  const trimmed = typeof rawValue === 'string' ? rawValue.trim() : '';
  const withoutSpecialChars = trimmed.replace(/\$/g, '').replace(/\./g, '_');
  const base = withoutSpecialChars || fallback;

  let candidate = base;
  let suffix = 2;

  while (usedKeys.has(candidate)) {
    candidate = `${base}_${suffix++}`;
  }

  usedKeys.add(candidate);
  return candidate;
}

function buildParameterDefaults(parameters: Parameter[]): Record<string, number> {
  const defaults: Record<string, number> = {};
  const usedKeys = new Set<string>();

  parameters.forEach((parameter, index) => {
    const fallback = `parameter_${index + 1}`;
    const key = sanitizeDocumentKey(parameter.name, fallback, usedKeys);
    defaults[key] = 0;
  });

  return defaults;
}

function resolveControlDefaultValue(control: Control): unknown {
  switch (control.type) {
    case 'threshold':
      return control.threshold ?? 0;
    case 'toggle':
      return control.defaultState ?? false;
    case 'refresh':
    default:
      return 0;
  }
}

function buildControlDefaults(controls: Control[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  const usedKeys = new Set<string>();

  controls.forEach((control, index) => {
    const fallback = `control_${index + 1}`;
    const preferredKey = control.label && control.label.trim() ? control.label : control.id;
    const key = sanitizeDocumentKey(preferredKey, fallback, usedKeys);
    defaults[key] = resolveControlDefaultValue(control);
  });

  return defaults;
}

async function getConfigCollection(): Promise<Collection<Config> | null> {
  if (!isMongoConfigured()) return null;
  return getCollection<Config>('configurations');
}

async function getParameterDefinitionCollection(
  configName: string,
): Promise<Collection<Document> | null> {
  return getCollection<Document>(getConfigParameterCollectionName(configName));
}

async function getControlDefinitionCollection(
  configName: string,
): Promise<Collection<Document> | null> {
  return getCollection<Document>(getConfigControlCollectionName(configName));
}

async function loadParameterDefinitions(configName: string): Promise<Parameter[]> {
  const collection = await getParameterDefinitionCollection(configName);
  if (!collection) {
    return [];
  }

  try {
    const documents = await collection
      .find<Record<string, unknown>>({}, { sort: { order: 1, _id: 1 } })
      .toArray();

    const parameters: Parameter[] = [];

    documents.forEach((document) => {
      if (document && typeof document === 'object' && 'id' in document && typeof document.id === 'string') {
        const { order, _id, ...rest } = document as ParameterDocument & { _id?: unknown };
        void order;
        void _id;
        parameters.push(rest as Parameter);
      }
    });

    return parameters;
  } catch (error) {
    console.error(`Failed to load parameter definitions for '${configName}':`, error);
    return [];
  }
}

async function loadControlDefinitions(configName: string): Promise<Control[]> {
  const collection = await getControlDefinitionCollection(configName);
  if (!collection) {
    return [];
  }

  try {
    const documents = await collection
      .find<Record<string, unknown>>({}, { sort: { order: 1, _id: 1 } })
      .toArray();

    const controls: Control[] = [];

    documents.forEach((document) => {
      if (document && typeof document === 'object' && 'id' in document && typeof document.id === 'string') {
        const { order, _id, ...rest } = document as ControlDocument & { _id?: unknown };
        void order;
        void _id;
        controls.push(rest as Control);
      }
    });

    return controls;
  } catch (error) {
    console.error(`Failed to load control definitions for '${configName}':`, error);
    return [];
  }
}

async function syncParameterDefinitions(configName: string, parameters: Parameter[]): Promise<void> {
  const collection = await getParameterDefinitionCollection(configName);
  if (!collection) {
    throw new Error('Database not configured or connection failed.');
  }

  const defaults = buildParameterDefaults(parameters);
  const document = { _id: 'defaults', ...defaults };

  await collection.replaceOne({ _id: 'defaults' }, document, { upsert: true });
  await collection.deleteMany({ _id: { $ne: 'defaults' } });
}

async function syncControlDefinitions(configName: string, controls: Control[]): Promise<void> {
  const collection = await getControlDefinitionCollection(configName);
  if (!collection) {
    throw new Error('Database not configured or connection failed.');
  }

  const defaults = buildControlDefaults(controls);
  const document = { _id: 'defaults', ...defaults };

  await collection.replaceOne({ _id: 'defaults' }, document, { upsert: true });
  await collection.deleteMany({ _id: { $ne: 'defaults' } });
}

async function dropCollectionIfExists(collectionName: string): Promise<void> {
  const collection = await getCollection<Record<string, never>>(collectionName);
  if (!collection) {
    return;
  }

  try {
    await collection.drop();
  } catch (error) {
    if (error instanceof Error && /ns not found/i.test(error.message)) {
      return;
    }
    console.error(`Failed to drop collection '${collectionName}':`, error);
  }
}

function buildDefaultConfig(): Config {
  return { name: 'Main Dashboard', parameters: [], controls: [] };
}

export async function getConfiguration(configName: string): Promise<Config> {
  const collection = await getConfigCollection();
  if (!collection) {
    if (configName === 'Main Dashboard') {
      return buildDefaultConfig();
    }
    notFound();
  }

  try {
    const config = await collection.findOne({ name: configName });
    if (!config) {
      if (configName === 'Main Dashboard') {
        return buildDefaultConfig();
      }
      notFound();
    }

    const [parameterDefinitions, controlDefinitions] = await Promise.all([
      loadParameterDefinitions(config.name).catch(() => []),
      loadControlDefinitions(config.name).catch(() => []),
    ]);

    const fallbackParameters = Array.isArray(config.parameters) ? config.parameters : [];
    const fallbackControls = Array.isArray(config.controls) ? config.controls : [];

    const parameters = parameterDefinitions.length > 0 ? parameterDefinitions : fallbackParameters;
    const controls = controlDefinitions.length > 0 ? controlDefinitions : fallbackControls;

    return {
      name: config.name,
      parameters,
      controls,
    };
  } catch (error) {
    console.error(`Failed to load configuration '${configName}':`, error);
    notFound();
  }
}

export async function getConfigurationNames(): Promise<string[]> {
  if (!isMongoConfigured()) {
    return [];
  }
  const collection = await getConfigCollection();
  if (!collection) {
    console.error('Could not connect to the database to fetch configuration names.');
    return [];
  }
  try {
    const configs = await collection.find({}, { projection: { name: 1 } }).toArray();
    return configs.map((c) => c.name);
  } catch (error) {
    console.error('Failed to get configuration names:', error);
    return [];
  }
}

export async function saveConfiguration(config: Config): Promise<{ success: boolean; error?: string }> {
  const collection = await getConfigCollection();
  if (!collection) {
    return { success: false, error: 'Database not configured or connection failed.' };
  }
  try {
    const validation = ConfigSchema.safeParse(config);
    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      return { success: false, error: errorMessage };
    }

    const { name, parameters, controls } = validation.data;

    await collection.updateOne(
      { name },
      { $set: { parameters, controls } },
      { upsert: true },
    );

    await Promise.all([
      syncParameterDefinitions(name, parameters),
      syncControlDefinitions(name, controls),
    ]);

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}

export async function createConfiguration(config: Config): Promise<{ success: boolean; error?: string }> {
  const collection = await getConfigCollection();
  if (!collection) {
    return { success: false, error: 'Database not configured or connection failed.' };
  }
  try {
    const validation = ConfigSchema.safeParse(config);
    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      return { success: false, error: errorMessage };
    }

    const { name, parameters, controls } = validation.data;

    const existing = await collection.findOne({ name });
    if (existing) {
      return { success: false, error: 'A configuration with this name already exists.' };
    }

    const insertResult = await collection.insertOne({ name, parameters, controls });

    try {
      await syncParameterDefinitions(name, parameters);
      await syncControlDefinitions(name, controls);
    } catch (syncError) {
      await collection.deleteOne({ _id: insertResult.insertedId });
      await dropCollectionIfExists(getConfigParameterCollectionName(name));
      await dropCollectionIfExists(getConfigControlCollectionName(name));

      if (syncError instanceof Error) {
        return { success: false, error: syncError.message };
      }
      return { success: false, error: 'An unknown error occurred.' };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}

export async function deleteConfiguration(configName: string): Promise<{ success: boolean; error?: string }> {
  const collection = await getConfigCollection();
  if (!collection) {
    return { success: false, error: 'Database not configured or connection failed.' };
  }
  try {
    const result = await collection.deleteOne({ name: configName });
    if (result.deletedCount === 0) {
      return { success: false, error: `Configuration '${configName}' not found.` };
    }

    await dropCollectionIfExists(getConfigParameterCollectionName(configName));
    await dropCollectionIfExists(getConfigControlCollectionName(configName));

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}

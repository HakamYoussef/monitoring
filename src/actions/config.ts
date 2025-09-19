'use server';

import { Collection } from 'mongodb';
import { notFound } from 'next/navigation';

import {
  getConfigControlCollectionName,
  getConfigParameterCollectionName,
} from '@/lib/collection-names';
import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import { Config, ConfigSchema, Control, Parameter } from '@/lib/types';

type ParameterDocument = Parameter & { order: number };
type ControlDocument = Control & { order: number };

async function getConfigCollection(): Promise<Collection<Config> | null> {
  if (!isMongoConfigured()) return null;
  return getCollection<Config>('configurations');
}

async function getParameterDefinitionCollection(
  configName: string,
): Promise<Collection<ParameterDocument> | null> {
  return getCollection<ParameterDocument>(getConfigParameterCollectionName(configName));
}

async function getControlDefinitionCollection(
  configName: string,
): Promise<Collection<ControlDocument> | null> {
  return getCollection<ControlDocument>(getConfigControlCollectionName(configName));
}

async function loadParameterDefinitions(configName: string): Promise<Parameter[]> {
  const collection = await getParameterDefinitionCollection(configName);
  if (!collection) {
    return [];
  }

  try {
    const documents = await collection
      .find({}, { sort: { order: 1, _id: 1 } })
      .toArray();

    return documents.map((document) => {
      const { order, _id, ...rest } = document;
      void order;
      void _id;
      return rest as Parameter;
    });
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
      .find({}, { sort: { order: 1, _id: 1 } })
      .toArray();

    return documents.map((document) => {
      const { order, _id, ...rest } = document;
      void order;
      void _id;
      return rest as Control;
    });
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

  await collection.createIndex({ id: 1 }, { unique: true });

  for (const [index, parameter] of parameters.entries()) {
    await collection.updateOne(
      { id: parameter.id },
      { $set: { ...parameter, order: index } },
      { upsert: true },
    );
  }

  if (parameters.length > 0) {
    const ids = parameters.map((parameter) => parameter.id);
    await collection.deleteMany({ id: { $nin: ids } });
  } else {
    await collection.deleteMany({});
  }
}

async function syncControlDefinitions(configName: string, controls: Control[]): Promise<void> {
  const collection = await getControlDefinitionCollection(configName);
  if (!collection) {
    throw new Error('Database not configured or connection failed.');
  }

  await collection.createIndex({ id: 1 }, { unique: true });

  for (const [index, control] of controls.entries()) {
    await collection.updateOne(
      { id: control.id },
      { $set: { ...control, order: index } },
      { upsert: true },
    );
  }

  if (controls.length > 0) {
    const ids = controls.map((control) => control.id);
    await collection.deleteMany({ id: { $nin: ids } });
  } else {
    await collection.deleteMany({});
  }
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

'use server';

import { Collection } from 'mongodb';
import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import { Config, ConfigSchema } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getConfigCollection(): Promise<Collection<Config> | null> {
  if (!isMongoConfigured()) return null;
  return getCollection<Config>('configurations');
}

export async function getConfiguration(configName: string): Promise<Config> {
  const collection = await getConfigCollection();
  if (!collection) {
    // If mongo is not configured, return a default empty config for demo purposes.
    if (configName === 'Main Dashboard') {
        return { name: 'Main Dashboard', parameters: [] };
    }
    notFound();
  }
  try {
    const config = await collection.findOne({ name: configName });
    if (!config) {
       if (configName === 'Main Dashboard') {
        return { name: 'Main Dashboard', parameters: [] };
      }
      notFound();
    }
    // Convert ObjectId to string for client-side usage if needed.
    return JSON.parse(JSON.stringify(config));
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
    // This can happen if the connection fails.
    console.error("Could not connect to the database to fetch configuration names.");
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
      const errorMessage = validation.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    
    const { name, ...updateData } = validation.data;
    
    const result = await collection.updateOne(
      { name: name },
      { $set: updateData },
      { upsert: true } // Use upsert to create if it doesn't exist
    );

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
      const errorMessage = validation.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    
    const existing = await collection.findOne({ name: validation.data.name });
    if (existing) {
      return { success: false, error: 'A configuration with this name already exists.' };
    }

    await collection.insertOne(validation.data);
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
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}

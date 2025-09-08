'use server';

import fs from 'fs/promises';
import path from 'path';
import { Config, ConfigSchema } from '@/lib/types';
import { notFound } from 'next/navigation';

const dataDirPath = path.join(process.cwd(), 'src', 'data');

async function ensureDataDirExists() {
  try {
    await fs.access(dataDirPath);
  } catch {
    await fs.mkdir(dataDirPath, { recursive: true });
  }
}

function getConfigFilePath(configName: string): string {
  // Sanitize the filename to prevent directory traversal
  const safeName = path.basename(configName).replace(/\.json$/, '');
  return path.join(dataDirPath, `${safeName}.json`);
}

export async function getConfiguration(configName: string): Promise<Config> {
  await ensureDataDirExists();
  const filePath = getConfigFilePath(configName);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const config = JSON.parse(fileContent);
    ConfigSchema.parse(config);
    return config;
  } catch (error) {
    console.error(`Failed to load configuration '${configName}':`, error);
    notFound();
  }
}

export async function getConfigurationNames(): Promise<string[]> {
  await ensureDataDirExists();
  try {
    const files = await fs.readdir(dataDirPath);
    return files
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace(/\.json$/, ''));
  } catch (error) {
    console.error('Failed to get configuration names:', error);
    return [];
  }
}


export async function saveConfiguration(config: Config): Promise<{ success: boolean; error?: string }> {
  await ensureDataDirExists();
  try {
    const validation = ConfigSchema.safeParse(config);
    if (!validation.success) {
      const errorMessage = validation.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    
    // In a multi-project setup, you might save to a different file based on config.name
    const filePath = getConfigFilePath(validation.data.name);
    const fileContent = JSON.stringify(validation.data, null, 2);
    await fs.writeFile(filePath, fileContent, 'utf-8');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}

export async function createConfiguration(config: Config): Promise<{ success: boolean; error?: string }> {
  await ensureDataDirExists();
  const filePath = getConfigFilePath(config.name);
  try {
    await fs.access(filePath);
    return { success: false, error: 'A configuration with this name already exists.' };
  } catch {
    // File does not exist, so we can create it
    return saveConfiguration(config);
  }
}

export async function deleteConfiguration(configName: string): Promise<{ success: boolean; error?: string }> {
  await ensureDataDirExists();
  const filePath = getConfigFilePath(configName);
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}
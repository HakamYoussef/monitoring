'use server';

import fs from 'fs/promises';
import path from 'path';
import { Config, ConfigSchema } from '@/lib/types';

const configFilePath = path.join(process.cwd(), 'src', 'data', 'config.json');

async function ensureDataDirExists() {
  try {
    await fs.access(path.dirname(configFilePath));
  } catch {
    await fs.mkdir(path.dirname(configFilePath), { recursive: true });
  }
}

export async function getConfiguration(): Promise<Config> {
  await ensureDataDirExists();
  try {
    const fileContent = await fs.readFile(configFilePath, 'utf-8');
    const config = JSON.parse(fileContent);
    ConfigSchema.parse(config);
    return config;
  } catch (error) {
    // If file doesn't exist or is empty/invalid, return a default empty config
    return { parameters: [] };
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
    
    const fileContent = JSON.stringify(validation.data, null, 2);
    await fs.writeFile(configFilePath, fileContent, 'utf-8');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}

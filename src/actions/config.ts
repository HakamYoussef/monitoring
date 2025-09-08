'use server';

import fs from 'fs/promises';
import path from 'path';
import { Config, ConfigSchema } from '@/lib/types';

// In a real application, you would fetch the config based on the user's project.
// For now, we'll keep it simple and use one file.
const configFilePath = path.join(process.cwd(), 'src', 'data', 'config.json');

async function ensureDataDirExists() {
  try {
    await fs.access(path.dirname(configFilePath));
  } catch {
    await fs.mkdir(path.dirname(configFilePath), { recursive: true });
  }
}

export async function getConfiguration(projectName?: string): Promise<Config> {
  await ensureDataDirExists();
  try {
    const fileContent = await fs.readFile(configFilePath, 'utf-8');
    const config = JSON.parse(fileContent);
    // In a multi-project setup, you might filter or load a different file
    // based on projectName. For this example, we return the config if the name matches.
    if (!projectName || config.name === projectName) {
      ConfigSchema.parse(config);
      return config;
    }
     // If project name is provided but doesn't match
     return { name: `Project '${projectName}' not found`, parameters: [] };

  } catch (error) {
    // If file doesn't exist or is empty/invalid, return a default empty config
    return { name: 'Default Configuration', parameters: [] };
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

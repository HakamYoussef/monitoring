'use server';

import { Collection } from 'mongodb';
import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import { User, UserSchema } from '@/lib/types';
import { revalidatePath } from 'next/cache';

async function getUserCollection(): Promise<Collection<User> | null> {
  if (!isMongoConfigured()) return null;
  return getCollection<User>('users');
}

export async function getUsers(): Promise<User[]> {
  const collection = await getUserCollection();
  if (!collection) {
    return [];
  }
  try {
    const users = await collection.find({}, { projection: { password: 0 } }).toArray(); // Don't send passwords to the client
    return JSON.parse(JSON.stringify(users));
  } catch (error) {
    console.error('Failed to get users:', error);
    return [];
  }
}

export async function createUser(user: User): Promise<{ success: boolean; error?: string }> {
  const collection = await getUserCollection();
  if (!collection) {
    return { success: false, error: 'Database not configured or connection failed.' };
  }
  try {
    const validation = UserSchema.safeParse(user);
    if (!validation.success) {
      const errorMessage = validation.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      return { success: false, error: errorMessage };
    }

    const existing = await collection.findOne({ username: validation.data.username });
    if (existing) {
      return { success: false, error: 'A user with this username already exists.' };
    }

    // In a real app, you would hash the password here.
    // For simplicity, we are storing it as plain text.
    await collection.insertOne(validation.data);
    revalidatePath('/accounts');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}

export async function deleteUser(username: string): Promise<{ success: boolean; error?: string }> {
  const collection = await getUserCollection();
  if (!collection) {
    return { success: false, error: 'Database not configured or connection failed.' };
  }
  try {
    const result = await collection.deleteOne({ username: username });
    if (result.deletedCount === 0) {
      return { success: false, error: `User '${username}' not found.` };
    }
    revalidatePath('/accounts');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}

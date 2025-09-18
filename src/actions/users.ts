'use server';

import { Collection } from 'mongodb';
import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import { User, UserSchema } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { hashPassword } from '@/lib/password';

async function getUserCollection(): Promise<Collection<User> | null> {
  if (!isMongoConfigured()) return null;
  return getCollection<User>('users');
}

type SafeUser = Omit<User, 'password'>;

export async function getUsers(): Promise<SafeUser[]> {
  const collection = await getUserCollection();
  if (!collection) {
    return [];
  }
  try {
    const users = await collection.find({}, { projection: { password: 0 } }).toArray(); // Don't send passwords to the client
    const sanitizedUsers: SafeUser[] = JSON.parse(JSON.stringify(users));
    return sanitizedUsers.map((user) => ({
      ...user,
      dashboardNames: Array.isArray(user.dashboardNames) ? user.dashboardNames : [],
    }));
  } catch (error) {
    console.error('Failed to get users:', error);
    return [];
  }
}

export async function getUser(username: string): Promise<SafeUser | null> {
  const collection = await getUserCollection();
  if (!collection) {
    return null;
  }
  try {
    const user = await collection.findOne({ username }, { projection: { password: 0 } });
    if (!user) return null;
    const sanitizedUser: SafeUser = JSON.parse(JSON.stringify(user));
    return {
      ...sanitizedUser,
      dashboardNames: Array.isArray(sanitizedUser.dashboardNames) ? sanitizedUser.dashboardNames : [],
    };
  } catch (error) {
    console.error(`Failed to get user '${username}':`, error);
    return null;
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

    const normalizedEmail = validation.data.email.toLowerCase();

    const existing = await collection.findOne({ $or: [
      { username: validation.data.username },
      { email: normalizedEmail },
    ] });
    if (existing) {
      if (existing.username === validation.data.username) {
        return { success: false, error: 'A user with this username already exists.' };
      }
      return { success: false, error: 'A user with this email already exists.' };
    }

    const hashedPassword = await hashPassword(validation.data.password);

    await collection.insertOne({
      ...validation.data,
      email: normalizedEmail,
      password: hashedPassword,
    });
    revalidatePath('/accounts');
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}

export async function updateUser(originalUsername: string, user: User): Promise<{ success: boolean; error?: string }> {
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

    const normalizedEmail = validation.data.email.toLowerCase();

    if (validation.data.username !== originalUsername) {
      const usernameConflict = await collection.findOne({ username: validation.data.username });

      if (usernameConflict) {
        return { success: false, error: 'A user with this username already exists.' };
      }
    }

    const emailConflict = await collection.findOne({
      email: normalizedEmail,
      username: { $ne: originalUsername },
    });

    if (emailConflict) {
      return { success: false, error: 'A user with this email already exists.' };
    }

    const hashedPassword = await hashPassword(validation.data.password);

    const result = await collection.updateOne(
      { username: originalUsername },
      {
        $set: {
          ...validation.data,
          email: normalizedEmail,
          password: hashedPassword,
        },
      },
    );
    if (result.matchedCount === 0) {
      return { success: false, error: `User '${originalUsername}' not found.` };
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

'use server';

import { z } from 'zod';
import { getSession, setSession, clearSession } from '@/lib/session';
import { Collection } from 'mongodb';
import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import { User } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

async function getUserCollection(): Promise<Collection<User> | null> {
  if (!isMongoConfigured()) return null;
  return getCollection<User>('users');
}

export async function login(credentials: z.infer<typeof LoginSchema>) {
  try {
    const validation = LoginSchema.safeParse(credentials);
    if (!validation.success) {
      return { success: false, error: 'Invalid credentials provided.' };
    }
    
    const { username, password } = validation.data;

    const collection = await getUserCollection();
    if (!collection) {
        return { success: false, error: 'Database is not configured.' };
    }

    const user = await collection.findOne({ username });

    if (!user) {
      return { success: false, error: 'Invalid username or password.' };
    }

    // In a real application, you would compare a hashed password.
    // For this example, we are comparing plain text passwords.
    const isPasswordValid = user.password === password;

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid username or password.' };
    }

    await setSession({
        isLoggedIn: true,
        username: user.username,
        dashboardName: user.dashboardName,
    });
    
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}

export async function logout() {
    await clearSession();
    revalidatePath('/', 'layout');
}

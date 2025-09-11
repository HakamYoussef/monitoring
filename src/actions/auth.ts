'use server';

import { z } from 'zod';
import { Collection } from 'mongodb';
import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import { User } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { setSession, clearSession } from './session';
import { createConfiguration } from './config';

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Authentication Actions

async function getUserCollection(): Promise<Collection<User> | null> {
  if (!isMongoConfigured()) return null;
  return getCollection<User>('users');
}

async function ensureDefaultUser() {
    const userCollection = await getUserCollection();
    if (!userCollection) return;

    const userCount = await userCollection.countDocuments();
    if (userCount === 0) {
        console.log("No users found. Creating default admin user.");
        // Also create a default dashboard config if none exist
        const configCollection = await getCollection('configurations');
        const configCount = await configCollection?.countDocuments();
        if (configCount === 0) {
            await createConfiguration({ name: 'Main Dashboard', parameters: [] });
        }

        const defaultUser: User = {
            username: 'admin',
            password: 'password', // In a real app, hash this!
            dashboardNames: ['Main Dashboard'],
            role: 'admin',
        };
        await userCollection.insertOne(defaultUser);
        console.log("Default admin user created.");
    }
}


export async function login(credentials: z.infer<typeof LoginSchema>) {
  try {
    const validation = LoginSchema.safeParse(credentials);
    if (!validation.success) {
      return { success: false, error: 'Invalid credentials provided.' };
    }
    
    const { username, password } = validation.data;

    // If Mongo is not configured, use a hardcoded default user for demonstration.
    if (!isMongoConfigured()) {
        if (username === 'admin' && password === 'password') {
            await setSession({
                isLoggedIn: true,
                username: 'admin',
                dashboardNames: ['Main Dashboard'],
                role: 'admin',
            });
            revalidatePath('/', 'layout');
            return { success: true };
        } else {
            return { success: false, error: 'Invalid username or password for default user.' };
        }
    }
    
    // If Mongo is configured, proceed with database authentication.
    await ensureDefaultUser();
    const collection = await getUserCollection();
     if (!collection) {
        // This case should theoretically not be hit if isMongoConfigured is true,
        // but it's good practice for robustness.
        return { success: false, error: 'Could not connect to the database.' };
    }

    const user = await collection.findOne({ username });

    if (!user) {
      return { success: false, error: 'Invalid username or password.' };
    }

    // In a real app, you would compare a hashed password.
    // For this demo, we're doing a simple string comparison.
    const isPasswordValid = user.password === password;

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid username or password.' };
    }

    await setSession({
        isLoggedIn: true,
        username: user.username,
        dashboardNames: user.dashboardNames,
        role: user.role,
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

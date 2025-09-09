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
            dashboardName: 'Main Dashboard',
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

    // First, check if Mongo is configured. If not, we can't proceed.
    if (!isMongoConfigured()) {
        return { success: false, error: 'Database is not configured. Please set MONGODB_URI.' };
    }
    
    // Now that we know it's configured, ensure the default user exists if needed.
    await ensureDefaultUser();

    // Get the collection, which should now succeed if configured.
    const collection = await getUserCollection();
    if (!collection) {
        // This case would be rare, e.g., if the connection fails mid-request
        return { success: false, error: 'Could not connect to the database.' };
    }

    const user = await collection.findOne({ username });

    if (!user) {
      return { success: false, error: 'Invalid username or password.' };
    }

    // In a real app, you should use a password hashing library like bcrypt.
    // For this demo, we are comparing plain text passwords.
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

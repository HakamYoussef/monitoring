'use server';

import { z } from 'zod';
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { Collection } from 'mongodb';
import { getCollection, isMongoConfigured } from '@/lib/mongodb';
import { User } from '@/lib/types';
import { SessionData, SessionDataSchema, sessionOptions } from '@/lib/session';
import { revalidatePath } from 'next/cache';

const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Session Management Functions

export async function getSession(): Promise<SessionData> {
  const session: IronSession<SessionData> = await getIronSession(cookies(), sessionOptions);
  
  const validation = SessionDataSchema.safeParse(session);
  if (validation.success) {
    return validation.data;
  }

  // If the session is uninitialized or invalid, return a default session object
  return SessionDataSchema.parse({});
}

export async function setSession(data: Partial<SessionData>) {
    const session = await getSession();
    Object.assign(session, data);
    const ironSession = await getIronSession<SessionData>(cookies(), sessionOptions);
    ironSession.isLoggedIn = session.isLoggedIn;
    ironSession.username = session.username;
    ironSession.dashboardName = session.dashboardName;
    await ironSession.save();
}

export async function clearSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.destroy();
}


// Authentication Actions

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

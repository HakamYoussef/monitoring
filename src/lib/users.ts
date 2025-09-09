'use server';

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import type { User, UserData, SignupData } from './types';
import { SignupSchema, UserSchema } from './types';


// In a real app, this would be a database, and passwords would be hashed.
// For this demo, we're storing data in a local JSON file.

const usersFilePath = path.join(process.cwd(), 'src', 'data', 'users.json');


async function readUsers(): Promise<User[]> {
  try {
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(usersFilePath), { recursive: true });
    const data = await fs.readFile(usersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, create it with a default user
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        const defaultUser: User = {
          id: '1',
          email: 'demo@example.com',
          password: 'password',
          accessibleDashboards: ['My Dashboard'],
        };
        await writeUsers([defaultUser]);
        return [defaultUser];
    }
    // Re-throw other errors
    throw error;
  }
}

async function writeUsers(users: User[]): Promise<void> {
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
}


export async function login(email: string, password: string): Promise<{ success: boolean; user?: UserData; error?: string }> {
  const users = await readUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  if (user.password !== password) {
    return { success: false, error: 'Invalid password.' };
  }

  const { password: _, ...userData } = user;
  return { success: true, user: userData };
}

export async function signup(data: SignupData): Promise<{ success: boolean; user?: UserData; error?: string }> {
    const validation = SignupSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: validation.error.issues.map(i => i.message).join(', ') };
    }
    
    const users = await readUsers();
    const existingUser = users.find(u => u.email === data.email);
    if (existingUser) {
        return { success: false, error: 'A user with this email already exists.' };
    }

    const newUser: User = {
        id: crypto.randomUUID(),
        ...data,
    };

    users.push(newUser);
    await writeUsers(users);
    
    const { password, ...userData } = newUser;

    return { success: true, user: userData };
}

export async function logout(): Promise<{ success: boolean }> {
  // In a real app, you might invalidate a session token on the server.
  // For this demo, the client-side handles clearing the session.
  return { success: true };
}

'use server';

import type { UserData } from './types';

// In a real app, this would be a database, and passwords would be hashed.
// For this demo, we're just checking against a hardcoded user.
const FAKE_USER: UserData & { password: string } = {
  id: '1',
  email: 'demo@example.com',
  password: 'password',
};

export async function login(email: string, password: string): Promise<{ success: boolean; user?: UserData; error?: string }> {
  if (email.toLowerCase() !== FAKE_USER.email || password !== FAKE_USER.password) {
    return { success: false, error: 'Invalid email or password.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userData } = FAKE_USER;
  
  return { success: true, user: userData };
}

export async function logout(): Promise<{ success: boolean }> {
  // In a real app, you might invalidate a session token on the server.
  // For this demo, the client-side handles clearing the session.
  return { success: true };
}

'use server';

import { cookies } from 'next/headers';
import { UserSession, UserSessionSchema } from './types';
import { redirect } from 'next/navigation';

const SESSION_COOKIE_NAME = 'user_session';

export async function createSession(user: UserSession) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = UserSessionSchema.parse(user);
  cookies().set(SESSION_COOKIE_NAME, JSON.stringify(session), { expires, httpOnly: true });
}

export async function getSession(): Promise<UserSession | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return null;
  }
  try {
    const session = JSON.parse(sessionCookie);
    return UserSessionSchema.parse(session);
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect('/login');
}

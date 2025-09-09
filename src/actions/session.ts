'use server';

import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, SessionDataSchema, sessionOptions } from '@/lib/session';

// This file is separate from auth.ts to avoid including mongodb in the middleware.

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

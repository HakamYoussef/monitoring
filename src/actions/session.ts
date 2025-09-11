'use server';

import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, SessionDataSchema, sessionOptions } from '@/lib/session';

// This file is separate from auth.ts to avoid including mongodb in the middleware.

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session: IronSession<SessionData> = await getIronSession(cookieStore, sessionOptions);
  
  const validation = SessionDataSchema.safeParse(session);
  if (validation.success) {
    return validation.data;
  }

  // If the session is uninitialized or invalid, return a default session object
  return SessionDataSchema.parse({});
}

export async function setSession(data: Partial<SessionData>) {
    const cookieStore = await cookies();
    const session = await getSession();
    Object.assign(session, data);
    const ironSession = await getIronSession<SessionData>(cookieStore, sessionOptions);
    ironSession.isLoggedIn = session.isLoggedIn;
    ironSession.username = session.username;
    // Store a copy of dashboard names to avoid mutation side effects
    ironSession.dashboardNames = [...session.dashboardNames];
    ironSession.role = session.role;
    await ironSession.save();
}

export async function clearSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.destroy();
}

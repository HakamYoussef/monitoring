'use server';

import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { z } from 'zod';

export const SessionDataSchema = z.object({
  isLoggedIn: z.boolean().default(false),
  username: z.string().optional(),
  dashboardName: z.string().optional(),
});

export type SessionData = z.infer<typeof SessionDataSchema>;

const sessionOptions = {
  cookieName: 'smart-monitoring-session',
  password: process.env.SESSION_PASSWORD || 'complex_password_at_least_32_characters_long_for_session_encryption',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
};

export async function getSession(): Promise<SessionData> {
  const session: IronSession<SessionData> = await getIronSession(cookies(), sessionOptions);
  
  // Validate session data, providing defaults if it's missing or invalid
  const validation = SessionDataSchema.safeParse(session);
  if (validation.success) {
    return validation.data;
  }

  // If validation fails, return the default empty session state
  return SessionDataSchema.parse({});
}

export async function setSession(data: Partial<SessionData>) {
    const session = await getSession();
    Object.assign(session, data);
    await session.save();
}

export async function clearSession() {
  const session = await getSession();
  session.destroy();
}

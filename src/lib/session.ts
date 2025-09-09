import { getIronSession, IronSession } from 'iron-session';
import { z } from 'zod';

export const SessionDataSchema = z.object({
  isLoggedIn: z.boolean().default(false),
  username: z.string().optional(),
  dashboardName: z.string().optional(),
});

export type SessionData = z.infer<typeof SessionDataSchema>;

export const sessionOptions = {
  cookieName: 'smart-monitoring-session',
  password: process.env.SESSION_PASSWORD || 'complex_password_at_least_32_characters_long_for_session_encryption',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
};

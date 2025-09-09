'use client';

import { useState, useEffect } from 'react';
import { getSession, SessionData } from '@/lib/session';

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        // This is a server action, but we can call it from the client
        const sessionData = await getSession();
        setSession(sessionData);
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, []);

  return { session, isLoading };
}

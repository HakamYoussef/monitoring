'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { login as apiLogin, signup as apiSignup, logout as apiLogout } from '@/lib/users';
import type { UserData, SignupData } from '@/lib/types';

type AuthContextType = {
  user: UserData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking for a user session
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Could not parse user from sessionStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.success && result.user) {
      sessionStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
      router.push('/dashboard');
    }
    return { success: result.success, error: result.error };
  };

  const logout = async () => {
    await apiLogout();
    sessionStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const signup = async (data: SignupData) => {
    const result = await apiSignup(data);
     if (result.success && result.user) {
      sessionStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
      router.push('/dashboard');
    }
    return result;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

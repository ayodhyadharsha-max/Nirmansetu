'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

export interface UserSession {
  id: string;
  email?: string;
  fullName: string;
  role: 'customer' | 'contractor' | 'supplier' | 'driver' | 'admin';
  phone?: string;
  companyName?: string;
  gstin?: string;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInDemoUser: (role?: 'customer' | 'contractor') => void;
  setUserSession: (session: UserSession | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'nirmansetu_auth_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        // First check localStorage for persistent session
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        }

        // Check active Supabase session
        const supabase = createBrowserSupabaseClient();
        const {
          data: { user: sbUser },
        } = await supabase.auth.getUser();

        if (sbUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sbUser.id)
            .maybeSingle();

          const session: UserSession = {
            id: sbUser.id,
            email: sbUser.email,
            fullName: profile?.full_name || sbUser.email?.split('@')[0] || 'Ayodhya Builder',
            role: profile?.role || 'customer',
            phone: profile?.phone_number || undefined,
            companyName: profile?.company_name || undefined,
            gstin: profile?.gstin || undefined,
          };
          setUser(session);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        }
      } catch {
        // Fallback safely
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const setUserSession = (session: UserSession | null) => {
    setUser(session);
    if (session) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const signInDemoUser = (role: 'customer' | 'contractor' = 'contractor') => {
    const demoSession: UserSession = {
      id: 'demo-user-ayodhya-001',
      email: role === 'contractor' ? 'contractor.ayodhya@nirmansetu.in' : 'builder@ayodhya.in',
      fullName: role === 'contractor' ? 'Shri Ram Infra Developers (Ayodhya)' : 'Vipin Sharma',
      role,
      phone: '+91 94500 12345',
      companyName: role === 'contractor' ? 'Shri Ram Infra & Contractors Ltd.' : undefined,
      gstin: role === 'contractor' ? '09AAACS1429B1ZB' : undefined,
    };
    setUserSession(demoSession);
  };

  const signOut = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    setUserSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signOut,
        signInDemoUser,
        setUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

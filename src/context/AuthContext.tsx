import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUser({
        id: '6cb3d1ff-e1a1-4ff9-ac11-bb925fee1ae4',
        app_metadata: {},
        user_metadata: { name: 'صاحب المشروع' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'geminiabufarah@gmail.com',
      } as User);
      setIsLoading(false);
      return;
    }

    // Check existing session or auto-login with owner
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        setIsLoading(false);
      } else {
        // Auto-login single owner account seamlessly
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'geminiabufarah@gmail.com',
          password: 'Nasser@1973_App',
        });

        if (!error && data?.session) {
          setSession(data.session);
          setUser(data.user);
        }
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      setUser({
        id: '6cb3d1ff-e1a1-4ff9-ac11-bb925fee1ae4',
        app_metadata: {},
        user_metadata: { name: 'صاحب المشروع' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: email || 'geminiabufarah@gmail.com',
      } as User);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured: isSupabaseConfigured,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

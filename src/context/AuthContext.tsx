import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { StorageService } from '../lib/storage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null; data?: any }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null; data?: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session and primary account setup
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUser({
        id: '6cb3d1ff-e1a1-4ff9-ac11-bb925fee1ae4',
        app_metadata: {},
        user_metadata: { name: 'المصمم الرئيسي' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'top2006design@gmail.com',
      } as User);
      setIsLoading(false);
      return;
    }

    const client = supabase;

    // Check existing session
    client.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        if (currentSession.user.email === 'top2006design@gmail.com') {
          await StorageService.assignOrphanEntriesToUser(currentSession.user.id);
        }
        setIsLoading(false);
      } else {
        // Automatically sign in primary user account (top2006design@gmail.com)
        try {
          const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
            email: 'top2006design@gmail.com',
            password: 'NasserLolo82',
          });

          if (!signInError && signInData?.session) {
            setSession(signInData.session);
            setUser(signInData.user);
            await StorageService.assignOrphanEntriesToUser(signInData.user.id);
          } else {
            // If user doesn't exist yet, create account
            const { data: signUpData, error: signUpError } = await client.auth.signUp({
              email: 'top2006design@gmail.com',
              password: 'NasserLolo82',
              options: {
                data: { name: 'Top Design' }
              }
            });

            if (!signUpError && signUpData?.user) {
              if (signUpData.session) {
                setSession(signUpData.session);
                setUser(signUpData.user);
                await StorageService.assignOrphanEntriesToUser(signUpData.user.id);
              }
            }
          }
        } catch (e) {
          console.warn('Auth auto-init note:', e);
        } finally {
          setIsLoading(false);
        }
      }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user && newSession.user.email === 'top2006design@gmail.com') {
        await StorageService.assignOrphanEntriesToUser(newSession.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      const mockUser = {
        id: 'user-' + email.replace(/[^a-zA-Z0-9]/g, ''),
        app_metadata: {},
        user_metadata: { name: email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: email,
      } as User;
      setUser(mockUser);
      return { error: null, data: { user: mockUser } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (!error && data?.user && data.user.email === 'top2006design@gmail.com') {
      await StorageService.assignOrphanEntriesToUser(data.user.id);
    }

    return { error, data };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured || !supabase) {
      const mockUser = {
        id: 'user-' + email.replace(/[^a-zA-Z0-9]/g, ''),
        app_metadata: {},
        user_metadata: { name: name || email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: email,
      } as User;
      setUser(mockUser);
      return { error: null, data: { user: mockUser } };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: { name: name?.trim() || email.split('@')[0] }
      }
    });

    return { error, data };
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
        signUp,
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

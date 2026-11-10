import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, translateSupabaseError } from '../lib/supabase';
import { resolveAuthEmail } from '../lib/authUtils';

const AuthContext = createContext({
  user: null,
  loading: true,
  isDemoMode: !isSupabaseConfigured,
  signIn: async () => {},
  signOut: async () => {},
});

const DEMO_USER = {
  id: 'demo-teacher',
  email: 'admin@storybook.local',
  user_metadata: { username: 'admin' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setUser(null);
        } else {
          setUser(data.session?.user ?? null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (usernameOrEmail, password) => {
    if (!isSupabaseConfigured || !supabase) {
      const entered = String(usernameOrEmail || '').trim();
      const demoAccount = entered
        ? {
            ...DEMO_USER,
            user_metadata: { username: entered.split('@')[0] },
          }
        : DEMO_USER;
      setUser(demoAccount);
      return demoAccount;
    }

    const resolved = resolveAuthEmail(usernameOrEmail);
    if (!resolved.valid) {
      throw new Error(resolved.error);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: resolved.email,
      password,
    });

    if (error) {
      throw new Error(translateSupabaseError(error));
    }
    return data.user;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(translateSupabaseError(error));
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode: !isSupabaseConfigured,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

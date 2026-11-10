import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, translateSupabaseError } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  loading: true,
  isDemoMode: !isSupabaseConfigured,
  signIn: async () => {},
  signOut: async () => {},
});

const DEMO_USER = {
  id: 'demo-teacher',
  email: 'teacher.demo@university.edu',
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

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(DEMO_USER);
      return DEMO_USER;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
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

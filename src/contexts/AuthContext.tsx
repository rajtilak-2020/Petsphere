import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export type UserRole = 'owner' | 'vet' | 'shelter' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  location?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setRole: (role: UserRole) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  setRole: async () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const initDone = useRef(false);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Profile fetch error:', error.message);
        return null;
      }

      return (data as UserProfile) || null;
    } catch (error) {
      console.error('[Auth] Profile fetch exception:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Initialize: get session + profile in one go, then set loading=false
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const prof = await fetchProfile(currentUser.id);
          if (mounted) setProfile(prof);
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          initDone.current = true;
        }
      }
    };

    initAuth();

    // 2. Listen for auth changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        // Skip events until init is done (initAuth handles the first load)
        if (!initDone.current) return;
        // Token refresh / initial session — user hasn't changed, skip loading flash
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;

        const currentUser = session?.user ?? null;

        if (currentUser) {
          // User signed in — fetch their profile
          setLoading(true);
          setUser(currentUser);
          const prof = await fetchProfile(currentUser.id);
          if (mounted) {
            setProfile(prof);
            setLoading(false);
          }
        } else {
          // User signed out
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const setRole = async (role: UserRole) => {
    if (!user) throw new Error('No authenticated user');

    const displayName = user.user_metadata?.full_name
      || user.user_metadata?.name
      || user.email?.split('@')[0]
      || 'User';

    const newProfile: UserProfile = {
      id: user.id,
      email: user.email || '',
      name: displayName,
      role,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('users')
      .upsert(newProfile, { onConflict: 'id' });

    if (error) {
      console.error('[Auth] Upsert error:', error.message, error.details, error.hint);
      throw new Error(error.message);
    }

    setProfile(newProfile);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) throw new Error('No authenticated user');

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) throw new Error(error.message);

    setProfile({ ...profile, ...updates });
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, setRole, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

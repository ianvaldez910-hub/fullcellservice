import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isLicenseValid: boolean;
  trialDaysLeft: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const clearAuthState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  }, []);

  const recoverFromAuthError = useCallback(async (error: unknown) => {
    console.error('Error restoring auth session:', error);
    await supabase.auth.signOut({ scope: 'local' });
    clearAuthState();
  }, [clearAuthState]);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      setProfile(data);

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!roleData);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid deadlock with Supabase auth
          setTimeout(() => {
            if (!mounted) return;
            fetchProfile(session.user.id)
              .catch(recoverFromAuthError)
              .finally(() => {
                if (mounted) setLoading(false);
              });
          }, 0);
        } else {
          clearAuthState();
          setLoading(false);
        }
      }
    );

    // Then restore session
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) throw error;
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          clearAuthState();
        }
      })
      .catch(recoverFromAuthError)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearAuthState, fetchProfile, recoverFromAuthError]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
  };

  const isLicenseValid = (() => {
    if (!profile) return false;
    if (isAdmin) return true;
    const planExpiry = (profile as any).fecha_vencimiento_plan;
    if (profile.license_status === 'active') {
      // If a plan expiry exists, enforce it
      if (planExpiry) return new Date(planExpiry) > new Date();
      return true;
    }
    if (profile.license_status === 'inactive') return false;
    // trial
    return new Date(profile.trial_ends_at) > new Date();
  })();

  const trialDaysLeft = (() => {
    if (!profile) return 0;
    const planExpiry = (profile as any).fecha_vencimiento_plan;
    const target = profile.license_status === 'active' && planExpiry
      ? new Date(planExpiry).getTime()
      : new Date(profile.trial_ends_at).getTime();
    const diff = target - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  // Only block on initial session restore. Profile load happens in background
  // so the UI never gets stuck on a white/loading screen.
  const isLoading = loading;

  return (
    <AuthContext.Provider value={{
      user, session, profile, isAdmin, loading: isLoading,
      signUp, signIn, signOut, refreshProfile,
      isLicenseValid, trialDaysLeft,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

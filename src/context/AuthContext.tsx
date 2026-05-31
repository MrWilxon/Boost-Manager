import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  uid: string;
  id: string;
  email: string | null;
  role: 'Admin' | 'User';
  balance: number;
  username: string;
  profilePic?: string;
  whatsapp?: string;
  profile_pic?: string;
  avatarUrl?: string;
  businessName?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, token: string) => {
    const timeoutId = setTimeout(() => {
      console.warn('[Auth] Profile fetch timed out ?" releasing loading state');
      setLoading(false);
    }, 8000);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }
      
      const mappedProfile: UserProfile = {
        uid: data.id,
        id: data.id,
        email: data.email,
        role: data.role as 'Admin' | 'User',
        balance: Number(data.balance),
        username: data.username,
        profilePic: data.profile_pic || undefined,
        whatsapp: data.whatsapp || undefined,
      };

      setProfile(mappedProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('boost_manager_profile', JSON.stringify(mappedProfile));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user && session?.access_token) {
      await fetchProfile(user.id, session.access_token);
    }
  };

  useEffect(() => {
    // 0. Aggressive UI Unblocking - Load cached profile instantly
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('boost_manager_profile');
        if (cached) {
          setProfile(JSON.parse(cached));
          setLoading(false); // Unblock the UI instantly for returning users
        }
      } catch (e) {
        console.error('Failed to parse cached profile', e);
      }
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && session?.access_token) {
        // If we don't have a cached profile, we wait. If we do, this runs silently.
        fetchProfile(session.user.id, session.access_token);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Failed to get session:', error);
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    let channel: any = null;

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && session?.access_token) {
        fetchProfile(session.user.id, session.access_token);
        
        // Real-time updates on profile table (e.g. balance, role)
        if (channel) supabase.removeChannel(channel);
        
        channel = supabase
          .channel('profile_changes_' + session.user.id)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'id=eq.' + session.user.id },
            (payload) => {
              const data = payload.new as any;
              const updatedProfile: UserProfile = {
                uid: data.id,
                id: data.id,
                email: data.email,
                role: data.role as 'Admin' | 'User',
                balance: Number(data.balance),
                username: data.username,
                profilePic: data.profile_pic || undefined,
                whatsapp: data.whatsapp || undefined,
              };
              setProfile(updatedProfile);
              if (typeof window !== 'undefined') {
                localStorage.setItem('boost_manager_profile', JSON.stringify(updatedProfile));
              }
            }
          )
          .subscribe();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('boost_manager_profile');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('boost_manager_profile');
    }
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



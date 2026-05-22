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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile from backend');
      }
      
      const data = await response.json();
      
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
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && session?.access_token) {
        fetchProfile(session.user.id, session.access_token);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && session?.access_token) {
        fetchProfile(session.user.id, session.access_token);
        
        // Real-time updates on profile table (e.g. balance, role)
        const channel = supabase
          .channel(`profile_changes_${Date.now()}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` },
            (payload) => {
              const data = payload.new as any;
              setProfile({
                uid: data.id,
                id: data.id,
                email: data.email,
                role: data.role as 'Admin' | 'User',
                balance: Number(data.balance),
                username: data.username,
                profilePic: data.profile_pic || undefined,
                whatsapp: data.whatsapp || undefined,
              });
            }
          )
          .subscribe();
          
        return () => {
          supabase.removeChannel(channel);
        };
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
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

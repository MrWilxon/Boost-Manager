import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

interface UserProfile {
  uid: string;
  email: string | null;
  role: 'Admin' | 'User';
  balance: number;
  username: string;
  mobileNumber?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // First check if profile exists, if not create it
        const profileRef = doc(db, 'users', firebaseUser.uid);
        try {
          const profileSnap = await getDoc(profileRef);
          const isAdminEmail = firebaseUser.email === 'wilxon.xtha@gmail.com';
          
          if (!profileSnap.exists()) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: isAdminEmail ? 'Admin' : 'User',
              balance: isAdminEmail ? 999999 : 0,
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            };
            await setDoc(profileRef, newProfile);
          } else {
            const currentRole = profileSnap.data().role;
            if (isAdminEmail && currentRole !== 'Admin') {
              await setDoc(profileRef, { role: 'Admin' }, { merge: true });
            }
          }
        } catch (error) {
          console.error("Error initializing profile:", error);
        }

        // Set up real-time listener for profile
        unsubscribeProfile = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
          setLoading(false);
        }, (err) => {
          console.error("Profile listener error:", err);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
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

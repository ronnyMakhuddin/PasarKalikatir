"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type UserRole = 'admin' | 'seller' | 'buyer';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  address?: string;
  storeName?: string;
  storeCategory?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  ktpNumber?: string;
  isVerified: boolean;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole, sellerData?: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase Auth not configured');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If we're in the process of logging out, don't try to access Firestore
      if (isLoggingOut) {
        console.log('Logging out, skipping Firestore access');
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }
      
      setUser(user);
      
      if (user && db) {
        try {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userProfile: UserProfile = {
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            } as UserProfile;
            setUserProfile(userProfile);
          } else {
            console.warn('User profile not found in Firestore');
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Don't throw error during logout, just clear the profile
          setUserProfile(null);
        }
      } else {
        // User is null (logged out), clear the profile
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [isLoggingOut]);

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase Auth not configured');
    }
    
    try {
      setLoading(true); // Set loading during sign in
      await signInWithEmailAndPassword(auth, email, password);
      // userProfile will be fetched by onAuthStateChanged
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole, sellerData?: Partial<UserProfile>) => {
    if (!auth || !db) {
      throw new Error('Firebase not configured');
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role,
        name,
        isVerified: role === 'buyer', // Only buyers are auto-verified
        createdAt: new Date(),
      };

      if (sellerData) {
        Object.assign(userProfile, sellerData);
      }

      await setDoc(doc(db, 'users', user.uid), userProfile);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error('Firebase Auth not configured');
    }
    
    try {
      console.log('Starting logout process...');
      
      // Set logging out flag FIRST to prevent any Firestore access
      setIsLoggingOut(true);
      
      // Clear user profile immediately to prevent any Firestore operations
      setUserProfile(null);
      setUser(null);
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then sign out from Firebase Auth
      await signOut(auth);
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if signOut fails, clear the local state
      setUserProfile(null);
      setUser(null);
      setIsLoggingOut(false);
      throw error;
    } finally {
      // Reset the logging out flag after a delay
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
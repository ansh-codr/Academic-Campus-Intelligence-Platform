import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile, UserRole, StudentRegisterInput } from '@solvesphere/shared';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  registerStudent: (input: StudentRegisterInput) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  loginAsStudent: () => Promise<void>;
  loginAsAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch ID token result to inspect custom claims (e.g. role)
        const tokenResult = await firebaseUser.getIdTokenResult();
        const customRole = (tokenResult.claims.role as UserRole) || 'STUDENT';

        // Retrieve Firestore profile from `users/{uid}`
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        let profileData: UserProfile;

        if (userDocSnap.exists()) {
          const raw = userDocSnap.data();
          profileData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || raw.email || '',
            fullName: raw.fullName || firebaseUser.displayName || 'University Student',
            studentId: raw.studentId || 'CS26019',
            role: customRole || raw.role || 'STUDENT',
            department: raw.department || 'Computer Science & AI',
            semester: raw.semester || 1,
            avatarUrl: raw.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
            createdAt: raw.createdAt || new Date().toISOString(),
          };
        } else {
          // Create initial user document if it does not exist
          profileData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || 'University Student',
            studentId: 'CS26019',
            role: customRole,
            department: 'Computer Science & AI',
            semester: 1,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, profileData);
        }

        setUser(profileData);
        setRole(profileData.role);
      } catch (err) {
        console.error('Error fetching user profile from Firestore:', err);
        // Fallback minimal profile
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || 'Student',
          role: 'STUDENT',
          createdAt: new Date().toISOString(),
        });
        setRole('STUDENT');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real Email / Password Registration
  const registerStudent = async (input: StudentRegisterInput): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, input.email, input.password);
      const uid = userCred.user.uid;

      const newProfile: UserProfile = {
        id: uid,
        email: input.email,
        fullName: input.fullName,
        studentId: input.studentId,
        role: 'STUDENT',
        department: 'Computer Science & AI',
        semester: 1,
        createdAt: new Date().toISOString(),
      };

      // Create Firestore document in `users/{uid}`
      await setDoc(doc(db, 'users', uid), newProfile);

      setUser(newProfile);
      setRole('STUDENT');
      return newProfile;
    } finally {
      setIsLoading(false);
    }
  };

  // Real Email / Password Sign In
  const login = async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const tokenResult = await cred.user.getIdTokenResult();
      const userRole = (tokenResult.claims.role as UserRole) || 'STUDENT';

      const userDocRef = doc(db, 'users', cred.user.uid);
      const userDocSnap = await getDoc(userDocRef);

      const profile: UserProfile = userDocSnap.exists()
        ? (userDocSnap.data() as UserProfile)
        : {
            id: cred.user.uid,
            email: cred.user.email || email,
            fullName: cred.user.displayName || 'University User',
            role: userRole,
            createdAt: new Date().toISOString(),
          };

      setUser(profile);
      setRole(userRole);
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Out
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  // Password Reset (Real Firebase Auth)
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Update Permitted Profile Fields
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('Not authenticated');

    // Prevent modifying privileged fields
    const { role: _r, id: _id, ...safeUpdates } = data;

    const userDocRef = doc(db, 'users', user.id);
    await updateDoc(userDocRef, safeUpdates);

    setUser((prev) => (prev ? { ...prev, ...safeUpdates } : null));
  };

  // 1-Click Demo Fill for Student (creates or signs into demo student account)
  const loginAsStudent = async () => {
    const demoEmail = 'student.demo@campus.edu';
    const demoPass = 'Student@2026';
    try {
      await login(demoEmail, demoPass);
    } catch {
      // Auto-register student demo account in emulator
      await registerStudent({
        fullName: 'Aarav Sharma',
        email: demoEmail,
        studentId: 'CS26019',
        password: demoPass,
        confirmPassword: demoPass,
      });
    }
  };

  // 1-Click Demo Fill for Admin (signs into provisioned admin account)
  const loginAsAdmin = async () => {
    const adminEmail = 'admin@campus.edu';
    const adminPass = 'SolveSphereAdmin@2026';
    await login(adminEmail, adminPass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerStudent,
        logout,
        resetPassword,
        updateProfile,
        loginAsStudent,
        loginAsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as updateFirebaseProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile, UserRole, StudentRegisterInput, StudentRegisterSchema } from '@solvesphere/shared';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  authError: string | null;
  profileError: string | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<{ profile: UserProfile; isNewUser: boolean; needsProfileCompletion: boolean }>;
  registerStudent: (input: StudentRegisterInput) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
  clearErrors: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setAuthError(null);
    setProfileError(null);
  }, []);

  // Synchronize Firebase Auth state and Firestore profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setIsEmailVerified(false);
        setAuthError(null);
        setProfileError(null);
        setIsLoading(false);
        return;
      }

      setIsEmailVerified(firebaseUser.emailVerified);

      try {
        // Fetch ID token result to inspect cryptographically verified custom claims
        const tokenResult = await firebaseUser.getIdTokenResult();
        const customRole = (tokenResult.claims.role as UserRole) || 'STUDENT';

        // Retrieve genuine Firestore profile from `users/{uid}`
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        let profileData: UserProfile;

        if (userDocSnap.exists()) {
          const raw = userDocSnap.data();
          profileData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || raw.email || '',
            fullName: raw.fullName || firebaseUser.displayName || 'University User',
            studentId: raw.studentId,
            role: customRole,
            emailVerified: firebaseUser.emailVerified,
            department: raw.department,
            semester: raw.semester,
            avatarUrl: raw.avatarUrl,
            createdAt: raw.createdAt || firebaseUser.metadata.creationTime || new Date().toISOString(),
            updatedAt: raw.updatedAt,
          };
          setProfileError(null);
        } else {
          // Minimal profile reflecting authenticated account without fictitious department/semester
          profileData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || 'University User',
            role: customRole,
            emailVerified: firebaseUser.emailVerified,
            createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          };
        }

        setUser(profileData);
        setRole(customRole);
      } catch (err: any) {
        console.error('Error synchronizing user profile from Firestore:', err);
        // Distinguish profile load error from auth identity error
        setProfileError('Unable to synchronize profile from Cloud Firestore. Using authenticated identity.');
        const customRole: UserRole = 'STUDENT';
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || 'University User',
          role: customRole,
          emailVerified: firebaseUser.emailVerified,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        });
        setRole(customRole);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check for Google Redirect Result on initial mount
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (cred) => {
        if (!cred || !cred.user) return;
        const firebaseUser = cred.user;
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          const now = new Date().toISOString();
          const profile: UserProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || 'University Student',
            role: 'STUDENT',
            emailVerified: firebaseUser.emailVerified,
            avatarUrl: firebaseUser.photoURL || undefined,
            createdAt: now,
            updatedAt: now,
          };
          try {
            await setDoc(userDocRef, profile);
            setUser(profile);
            setRole('STUDENT');
          } catch (e) {
            console.warn('Could not auto-create profile from Google redirect:', e);
          }
        }
      })
      .catch((err: any) => {
        console.warn('Google redirect result error:', err);
      });
  }, []);

  // Reload current Firebase user to refresh verification status and claims
  const reloadUser = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      const refreshed = auth.currentUser;
      setIsEmailVerified(refreshed.emailVerified);

      const tokenResult = await refreshed.getIdTokenResult(true);
      const customRole = (tokenResult.claims.role as UserRole) || 'STUDENT';
      setRole(customRole);

      setUser((prev) => (prev ? { ...prev, emailVerified: refreshed.emailVerified, role: customRole } : null));
    } catch (err: any) {
      console.warn('Failed to reload Firebase user:', err);
      setAuthError(err.message || 'Could not refresh user session.');
    }
  }, []);

  // Real Email / Password Student Registration
  const registerStudent = async (input: StudentRegisterInput): Promise<UserProfile> => {
    // Validate payload against shared schema
    StudentRegisterSchema.parse(input);

    setIsLoading(true);
    setAuthError(null);
    setProfileError(null);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);

      // Update Firebase Auth displayName
      try {
        await updateFirebaseProfile(userCred.user, {
          displayName: input.fullName.trim(),
        });
      } catch (profileErr) {
        console.warn('Could not update Firebase Auth displayName:', profileErr);
      }

      // Send email verification with clear recovery state if it fails
      try {
        await sendEmailVerification(userCred.user);
      } catch (verifyErr: any) {
        console.warn('Verification email dispatch deferred:', verifyErr);
        // Non-fatal: user can resend from profile or verification banner
      }

      const now = new Date().toISOString();
      const newProfile: UserProfile = {
        id: userCred.user.uid,
        email: input.email.trim(),
        fullName: input.fullName.trim(),
        studentId: input.studentId.trim(),
        role: 'STUDENT',
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      };

      // Persist genuine profile in `users/{uid}`
      try {
        await setDoc(doc(db, 'users', userCred.user.uid), newProfile);
      } catch (firestoreErr: any) {
        console.error('Firestore profile persistence failed:', firestoreErr);
        setProfileError('Account created, but initial profile initialization encountered a network issue. Please sign in to retry.');
        // Do NOT delete the genuine Firebase Auth account after ambiguous network errors
      }

      setUser(newProfile);
      setRole('STUDENT');
      setIsEmailVerified(false);
      return newProfile;
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Real Email / Password Sign In
  const login = async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    setAuthError(null);
    setProfileError(null);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const tokenResult = await cred.user.getIdTokenResult();
      const userRole = (tokenResult.claims.role as UserRole) || 'STUDENT';

      setIsEmailVerified(cred.user.emailVerified);

      const userDocRef = doc(db, 'users', cred.user.uid);
      let profile: UserProfile;

      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          profile = {
            ...userDocSnap.data(),
            emailVerified: cred.user.emailVerified,
            role: userRole,
          } as UserProfile;
        } else {
          // Genuine account without existing profile document
          profile = {
            id: cred.user.uid,
            email: cred.user.email || email,
            fullName: cred.user.displayName || 'University User',
            role: userRole,
            emailVerified: cred.user.emailVerified,
            createdAt: cred.user.metadata.creationTime || new Date().toISOString(),
          };
        }
      } catch (readErr: any) {
        console.warn('Could not read user profile from Firestore:', readErr);
        setProfileError('Failed to read profile details from Firestore. Displaying authenticated session.');
        profile = {
          id: cred.user.uid,
          email: cred.user.email || email,
          fullName: cred.user.displayName || 'University User',
          role: userRole,
          emailVerified: cred.user.emailVerified,
          createdAt: cred.user.metadata.creationTime || new Date().toISOString(),
        };
      }

      setUser(profile);
      setRole(userRole);
      return profile;
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In (Firebase Auth SDK)
  const loginWithGoogle = async (): Promise<{ profile: UserProfile; isNewUser: boolean; needsProfileCompletion: boolean }> => {
    setIsLoading(true);
    setAuthError(null);
    setProfileError(null);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      let cred;
      try {
        cred = await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        if (popupErr.code === 'auth/popup-blocked') {
          console.warn('Popup blocked by browser, falling back to redirect:', popupErr);
          await signInWithRedirect(auth, provider);
          return null as any;
        }
        throw popupErr;
      }

      const firebaseUser = cred.user;
      const tokenResult = await firebaseUser.getIdTokenResult();
      const customRole = (tokenResult.claims.role as UserRole) || 'STUDENT';
      setIsEmailVerified(firebaseUser.emailVerified);

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let profile: UserProfile;
      let isNewUser = false;
      let needsProfileCompletion = false;

      if (userDocSnap.exists()) {
        const raw = userDocSnap.data();
        profile = {
          ...raw,
          id: firebaseUser.uid,
          email: firebaseUser.email || raw.email || '',
          fullName: raw.fullName || firebaseUser.displayName || 'University User',
          role: customRole,
          emailVerified: firebaseUser.emailVerified,
          createdAt: raw.createdAt || firebaseUser.metadata.creationTime || new Date().toISOString(),
        } as UserProfile;
        needsProfileCompletion = !profile.studentId && customRole !== 'ADMIN';
      } else {
        isNewUser = true;
        needsProfileCompletion = customRole !== 'ADMIN';
        const now = new Date().toISOString();
        profile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || 'University Student',
          role: 'STUDENT',
          emailVerified: firebaseUser.emailVerified,
          avatarUrl: firebaseUser.photoURL || undefined,
          createdAt: now,
          updatedAt: now,
        };

        try {
          await setDoc(userDocRef, profile);
        } catch (setErr: any) {
          console.error('Failed to create initial Google student profile in Firestore:', setErr);
          setProfileError('Failed to initialize profile in Firestore. You can complete setup in profile settings.');
        }
      }

      setUser(profile);
      setRole(customRole);
      return { profile, isNewUser, needsProfileCompletion };
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      let userFriendlyMsg = 'Google sign-in failed. Please try again.';
      if (err.code === 'auth/popup-closed-by-user') {
        userFriendlyMsg = 'Sign in was cancelled (window was closed before finishing).';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        userFriendlyMsg = 'An account already exists with this email using a different sign-in method. Please sign in with your email and password.';
      } else if (err.code === 'auth/unauthorized-domain') {
        userFriendlyMsg = 'This domain is not authorized for Google Sign-In in Firebase Console.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        userFriendlyMsg = 'Only one Google sign-in window can be open at a time.';
      } else if (err.code === 'auth/network-request-failed') {
        userFriendlyMsg = 'Network failure during Google sign-in. Please check your internet connection.';
      }
      setAuthError(userFriendlyMsg);
      throw new Error(userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Out
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
    setIsEmailVerified(false);
    setAuthError(null);
    setProfileError(null);
  };

  // Password Reset (Real Firebase Auth)
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // Send Email Verification with rate protection
  const sendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No authenticated user session');
    if (auth.currentUser.emailVerified) throw new Error('Email is already verified');
    await sendEmailVerification(auth.currentUser);
  };

  // Update Permitted Profile Fields (Department, Semester, Bio, and initial Student ID)
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !auth.currentUser) throw new Error('Not authenticated');

    // Prevent modifying immutable or privileged fields from client
    const { role: _r, id: _id, email: _e, emailVerified: _ev, ...safeUpdates } = data;

    const userDocRef = doc(db, 'users', user.id);
    const updatesWithTimestamp: Record<string, any> = {
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    };

    // If student already has a registered studentId, do not allow changing it from client
    if (user.studentId && updatesWithTimestamp.studentId && updatesWithTimestamp.studentId !== user.studentId) {
      delete updatesWithTimestamp.studentId;
    }

    await updateDoc(userDocRef, updatesWithTimestamp);
    setUser((prev) => (prev ? { ...prev, ...updatesWithTimestamp } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isEmailVerified,
        isLoading,
        authError,
        profileError,
        login,
        loginWithGoogle,
        registerStudent,
        logout,
        resetPassword,
        updateProfile,
        sendVerificationEmail,
        reloadUser,
        clearErrors,
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

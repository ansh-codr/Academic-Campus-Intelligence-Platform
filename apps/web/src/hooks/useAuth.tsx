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
import { doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  UserProfile,
  UserRole,
  StudentRegisterInput,
  StudentRegisterSchema,
  EnrollmentStatus,
  EnrollmentRequest,
} from '@solvesphere/shared';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  verificationCooldown: number;
  authError: string | null;
  profileError: string | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<{ profile: UserProfile; isNewUser: boolean; needsProfileCompletion: boolean }>;
  registerStudent: (input: StudentRegisterInput) => Promise<UserProfile>;
  submitEnrollmentRequest: (data: { studentId: string; department: string; semester: number; fullName?: string }) => Promise<void>;
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
  const [verificationCooldown, setVerificationCooldown] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setAuthError(null);
    setProfileError(null);
  }, []);

  // Cooldown countdown for verification email resends
  useEffect(() => {
    if (verificationCooldown <= 0) return;
    const timer = setInterval(() => {
      setVerificationCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [verificationCooldown]);

  // Synchronize Firebase Auth state and Firestore profile
  useEffect(() => {
    let revision = 0;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      const current = ++revision;
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

        // Also check enrollmentRequests/{uid} for review status
        let enrollmentStatus: EnrollmentStatus = 'INCOMPLETE';
        let rejectionReason: string | null = null;

        try {
          const reqSnap = await getDoc(doc(db, 'enrollmentRequests', firebaseUser.uid));
          if (reqSnap.exists()) {
            const reqData = reqSnap.data() as EnrollmentRequest;
            enrollmentStatus = reqData.status;
            rejectionReason = reqData.rejectionReason || null;
          }
        } catch (_reqErr) {
          // Non-fatal if enrollmentRequests collection is unavailable
        }

        let profileData: UserProfile;

        if (userDocSnap.exists()) {
          const raw = userDocSnap.data();
          const finalStatus: EnrollmentStatus = customRole === 'ADMIN'
            ? 'VERIFIED'
            : (raw.enrollmentStatus === 'VERIFIED' ? 'VERIFIED' : (enrollmentStatus !== 'INCOMPLETE' ? enrollmentStatus : raw.enrollmentStatus || 'INCOMPLETE'));

          profileData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || raw.email || '',
            fullName: raw.fullName || firebaseUser.displayName || 'University User',
            studentId: raw.studentId,
            role: customRole,
            emailVerified: firebaseUser.emailVerified,
            enrollmentStatus: finalStatus,
            rejectionReason: raw.rejectionReason || rejectionReason,
            department: raw.department,
            semester: raw.semester,
            avatarUrl: raw.avatarUrl,
            createdAt: raw.createdAt || firebaseUser.metadata.creationTime || new Date().toISOString(),
            updatedAt: raw.updatedAt,
          };
          setProfileError(null);
        } else {
          // Minimal profile reflecting authenticated account without fictitious data
          profileData = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || 'University User',
            role: customRole,
            emailVerified: firebaseUser.emailVerified,
            enrollmentStatus: customRole === 'ADMIN' ? 'VERIFIED' : enrollmentStatus,
            createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          };
        }

        if (current !== revision || auth.currentUser?.uid !== firebaseUser.uid) return;
        setUser(profileData);
        setRole(customRole);
      } catch (err: any) {
        if (current !== revision || auth.currentUser?.uid !== firebaseUser.uid) return;
        setProfileError('Unable to synchronize profile from Cloud Firestore. Using authenticated identity.');
        const customRole: UserRole = 'STUDENT';
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || 'University User',
          role: customRole,
          emailVerified: firebaseUser.emailVerified,
          enrollmentStatus: 'INCOMPLETE',
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
        });
        setRole(customRole);
      } finally {
        if (current === revision) setIsLoading(false);
      }
    });

    return () => { revision++; unsubscribe(); };
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
            enrollmentStatus: 'INCOMPLETE',
            ...(firebaseUser.photoURL ? { avatarUrl: firebaseUser.photoURL } : {}),
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

      // Re-read profile and enrollment status
      const userDocSnap = await getDoc(doc(db, 'users', refreshed.uid));
      let currentEnrollment: EnrollmentStatus = 'INCOMPLETE';
      try {
        const reqSnap = await getDoc(doc(db, 'enrollmentRequests', refreshed.uid));
        if (reqSnap.exists()) {
          currentEnrollment = reqSnap.data().status as EnrollmentStatus;
        }
      } catch (_e) {}

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUser({
          ...data,
          id: refreshed.uid,
          email: refreshed.email || data.email,
          role: customRole,
          emailVerified: refreshed.emailVerified,
          enrollmentStatus: customRole === 'ADMIN'
            ? 'VERIFIED'
            : (data.enrollmentStatus === 'VERIFIED' ? 'VERIFIED' : (currentEnrollment !== 'INCOMPLETE' ? currentEnrollment : data.enrollmentStatus || 'INCOMPLETE')),
        } as UserProfile);
      } else {
        setUser((prev) => (prev ? { ...prev, emailVerified: refreshed.emailVerified, role: customRole } : null));
      }
    } catch (err: any) {
      console.warn('Failed to reload Firebase user:', err);
      setAuthError(err.message || 'Could not refresh user session.');
    }
  }, []);

  // Real Email / Password Student Registration
  const registerStudent = async (input: StudentRegisterInput): Promise<UserProfile> => {
    StudentRegisterSchema.parse(input);

    setIsLoading(true);
    setAuthError(null);
    setProfileError(null);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);

      try {
        await updateFirebaseProfile(userCred.user, {
          displayName: input.fullName.trim(),
        });
      } catch (profileErr) {
        console.warn('Could not update Firebase Auth displayName:', profileErr);
      }

      try {
        await sendEmailVerification(userCred.user);
      } catch (verifyErr: any) {
        console.warn('Verification email dispatch deferred:', verifyErr);
      }

      const now = new Date().toISOString();
      const newProfile: UserProfile = {
        id: userCred.user.uid, email: userCred.user.email!, fullName: input.fullName.trim(),
        role: 'STUDENT', emailVerified: false, enrollmentStatus: 'INCOMPLETE',
        createdAt: now, updatedAt: now,
      };
      try {
        await setDoc(doc(db, 'users', userCred.user.uid), newProfile);
      } catch {
        throw new Error('Account created. Sign in and open Complete Profile to finish enrollment.');
      }

      setUser(newProfile);
      setRole('STUDENT');
      setIsEmailVerified(false);
      return newProfile;
    } catch (err: any) {
      if (err.code === 'auth/user-disabled') {
        const msg = 'This student account has been disabled by university administration. Please contact academic support.';
        setAuthError(msg);
        throw new Error(msg);
      }
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

      // Check enrollment request status
      let enrollmentStatus: EnrollmentStatus = 'INCOMPLETE';
      let rejectionReason: string | null = null;
      try {
        const reqSnap = await getDoc(doc(db, 'enrollmentRequests', cred.user.uid));
        if (reqSnap.exists()) {
          const reqData = reqSnap.data() as EnrollmentRequest;
          enrollmentStatus = reqData.status;
          rejectionReason = reqData.rejectionReason || null;
        }
      } catch (_e) {}

      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const raw = userDocSnap.data();
          const finalStatus: EnrollmentStatus = userRole === 'ADMIN'
            ? 'VERIFIED'
            : (raw.enrollmentStatus === 'VERIFIED' ? 'VERIFIED' : (enrollmentStatus !== 'INCOMPLETE' ? enrollmentStatus : raw.enrollmentStatus || 'INCOMPLETE'));

          profile = {
            ...raw,
            id: cred.user.uid,
            email: cred.user.email || email,
            fullName: raw.fullName || cred.user.displayName || 'University User',
            emailVerified: cred.user.emailVerified,
            role: userRole,
            enrollmentStatus: finalStatus,
            rejectionReason: raw.rejectionReason || rejectionReason,
          } as UserProfile;
        } else {
          profile = {
            id: cred.user.uid,
            email: cred.user.email || email,
            fullName: cred.user.displayName || 'University User',
            role: userRole,
            emailVerified: cred.user.emailVerified,
            enrollmentStatus: userRole === 'ADMIN' ? 'VERIFIED' : enrollmentStatus,
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
          enrollmentStatus: userRole === 'ADMIN' ? 'VERIFIED' : 'INCOMPLETE',
          createdAt: cred.user.metadata.creationTime || new Date().toISOString(),
        };
      }

      setUser(profile);
      setRole(userRole);
      return profile;
    } catch (err: any) {
      if (err.code === 'auth/user-disabled') {
        const msg = 'This account has been disabled by university administration. Please contact academic support.';
        setAuthError(msg);
        throw new Error(msg);
      }
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

      // Inspect enrollmentRequests
      let enrollmentStatus: EnrollmentStatus = 'INCOMPLETE';
      let rejectionReason: string | null = null;
      try {
        const reqSnap = await getDoc(doc(db, 'enrollmentRequests', firebaseUser.uid));
        if (reqSnap.exists()) {
          const reqData = reqSnap.data() as EnrollmentRequest;
          enrollmentStatus = reqData.status;
          rejectionReason = reqData.rejectionReason || null;
        }
      } catch (_e) {}

      if (userDocSnap.exists()) {
        const raw = userDocSnap.data();
        const finalStatus: EnrollmentStatus = customRole === 'ADMIN'
          ? 'VERIFIED'
          : (raw.enrollmentStatus === 'VERIFIED' ? 'VERIFIED' : (enrollmentStatus !== 'INCOMPLETE' ? enrollmentStatus : raw.enrollmentStatus || 'INCOMPLETE'));

        profile = {
          ...raw,
          id: firebaseUser.uid,
          email: firebaseUser.email || raw.email || '',
          fullName: raw.fullName || firebaseUser.displayName || 'University User',
          role: customRole,
          emailVerified: firebaseUser.emailVerified,
          enrollmentStatus: finalStatus,
          rejectionReason: raw.rejectionReason || rejectionReason,
          createdAt: raw.createdAt || firebaseUser.metadata.creationTime || new Date().toISOString(),
        } as UserProfile;
        needsProfileCompletion = (!profile.studentId || profile.enrollmentStatus !== 'VERIFIED') && customRole !== 'ADMIN';
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
          enrollmentStatus: customRole === 'ADMIN' ? 'VERIFIED' : 'INCOMPLETE',
          ...(firebaseUser.photoURL ? { avatarUrl: firebaseUser.photoURL } : {}),
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
      } else if (err.code === 'auth/user-disabled') {
        userFriendlyMsg = 'This account has been disabled by university administration. Please contact academic support.';
      }
      setAuthError(userFriendlyMsg);
      throw new Error(userFriendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit official institutional enrollment request for administrative verification
  const submitEnrollmentRequest = async (data: {
    studentId: string;
    department: string;
    semester: number;
    fullName?: string;
  }) => {
    if (!auth.currentUser || !user) throw new Error('Not authenticated');

    const cleanStudentId = data.studentId.trim();
    const cleanDept = data.department.trim();
    const cleanName = (data.fullName || user.fullName || auth.currentUser.displayName || 'University Student').trim();
    const now = new Date().toISOString();

    const reqDocRef = doc(db, 'enrollmentRequests', user.id);
    const reqSnap = await getDoc(reqDocRef);

    const batch = writeBatch(db);
    if (reqSnap.exists()) {
      // Controlled update preserving administrative audit fields (reviewedAt, reviewedBy, rejectionReason)
      batch.update(reqDocRef, {
        fullName: cleanName,
        studentId: cleanStudentId,
        department: cleanDept,
        semester: data.semester,
        status: 'PENDING',
        submittedAt: now,
        updatedAt: now,
      });
    } else {
      // Initial creation
      batch.set(reqDocRef, {
        id: user.id,
        userId: user.id,
        fullName: cleanName,
        email: user.email || auth.currentUser.email || '',
        studentId: cleanStudentId,
        department: cleanDept,
        semester: data.semester,
        status: 'PENDING',
        submittedAt: now,
        updatedAt: now,
      });
    }

    // 2. Update non-privileged user profile fields (without setting verified studentId)
    const userDocRef = doc(db, 'users', user.id);
    const existingProfile = await getDoc(userDocRef);
    batch.set(userDocRef, {
      ...(existingProfile.exists() ? {} : {
        id: user.id, email: auth.currentUser.email, role: 'STUDENT', createdAt: now,
        enrollmentStatus: 'PENDING', emailVerified: auth.currentUser.emailVerified,
      }),
      fullName: cleanName,
      department: cleanDept,
      semester: data.semester,
      updatedAt: now,
    }, { merge: true });
    await batch.commit();

    setUser((prev) =>
      prev
        ? {
            ...prev,
            fullName: cleanName,
            department: cleanDept,
            semester: data.semester,
            enrollmentStatus: 'PENDING',
            rejectionReason: null,
          }
        : null
    );
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

  // Send Email Verification with rate protection & cooldown
  const sendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No authenticated user session');
    if (auth.currentUser.emailVerified) throw new Error('Email is already verified');
    if (verificationCooldown > 0) {
      throw new Error(`Please wait ${verificationCooldown} seconds before requesting another verification email.`);
    }
    await sendEmailVerification(auth.currentUser);
    setVerificationCooldown(60);
  };

  // Update Permitted Profile Fields (Department, Semester, Bio, Avatar)
  // Authoritative studentId and enrollmentStatus cannot be altered by student directly
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !auth.currentUser) throw new Error('Not authenticated');

    const {
      role: _r,
      id: _id,
      email: _e,
      emailVerified: _ev,
      studentId: _sid,
      enrollmentStatus: _es,
      rejectionReason: _rr,
      ...safeUpdates
    } = data;

    const userDocRef = doc(db, 'users', user.id);
    const updatesWithTimestamp: Record<string, any> = {
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    };

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
        verificationCooldown,
        authError,
        profileError,
        login,
        loginWithGoogle,
        registerStudent,
        submitEnrollmentRequest,
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

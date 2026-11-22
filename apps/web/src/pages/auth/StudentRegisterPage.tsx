import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StudentRegisterSchema, StudentRegisterInput } from '@solvesphere/shared';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GraduationCap, ArrowRight, CheckCircle, Info, AlertCircle, Mail } from 'lucide-react';

export const StudentRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerStudent, loginWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsGoogleSubmitting(true);
    setAuthError(null);
    try {
      const res = await loginWithGoogle();
      if (!res) return; // Redirect initiated
      if (res.needsProfileCompletion) {
        navigate('/auth/complete-profile');
      } else {
        navigate('/portal/overview');
      }
    } catch (err: any) {
      console.error('Google sign-up failure:', err);
      setAuthError(err.message || 'Google registration could not be completed.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentRegisterInput>({
    resolver: zodResolver(StudentRegisterSchema),
    defaultValues: {
      fullName: '',
      email: '',
      studentId: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: StudentRegisterInput) => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await registerStudent(data);
      setRegisteredSuccess(true);
      setTimeout(() => {
        navigate('/portal/overview');
      }, 1500);
    } catch (err: any) {
      console.error('Registration failed:', err);
      let msg = err.message || 'Registration failed. Please check your inputs.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 8 characters with numbers and uppercase.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network connection failure. Please check your internet connection.';
      }
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center text-white mx-auto shadow-glow-blue">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Student Registration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create your account with your verified university credentials.
          </p>
        </div>

        {/* Firebase Authentication Notice */}
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-brand-blue dark:text-blue-300 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Official Authentication:</strong> Student credentials and profiles are securely stored in Firebase Auth and Cloud Firestore. A verification email will be dispatched upon registration.
          </span>
        </div>

        {authError && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {registeredSuccess && (
          <div role="status" className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-in zoom-in-95">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Account successfully created in Firebase!</span>
            </div>
            <p className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400 pl-6 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              Verification link dispatched to your email. Launching your student portal...
            </p>
          </div>
        )}

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Priyanshu Verma"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="University Email"
              type="email"
              placeholder="e.g. student@institution.edu"
              error={errors.email?.message}
              helperText="Must be a valid email for verification."
              {...register('email')}
            />

            <Input
              label="Student ID / Enrollment Number"
              placeholder="e.g. STU-2026-1042"
              error={errors.studentId?.message}
              helperText="Letters, numbers, and hyphens only."
              {...register('studentId')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full mt-3"
              isLoading={isSubmitting}
            >
              <span>Create Account in Firebase</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Social Auth Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider">
                Or register with
              </span>
            </div>
          </div>

          {/* Sign up with Google Button */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm"
            onClick={handleGoogleSignUp}
            isLoading={isGoogleSubmitting}
          >
            <svg className="w-4 h-4 mr-2.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign up with Google</span>
          </Button>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/auth/login" className="font-bold text-brand-blue hover:underline">
              Sign In with Firebase &rarr;
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

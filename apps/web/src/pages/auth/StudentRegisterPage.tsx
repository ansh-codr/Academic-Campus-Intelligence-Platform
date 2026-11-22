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
  const { registerStudent } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

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

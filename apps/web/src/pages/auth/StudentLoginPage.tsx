import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StudentLoginSchema, StudentLoginInput } from '@solvesphere/shared';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight, GraduationCap, AlertCircle } from 'lucide-react';

export const StudentLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentLoginInput>({
    resolver: zodResolver(StudentLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: StudentLoginInput) => {
    setIsSubmitting(true);
    setLoginError(null);
    try {
      await login(data.email, data.password);
      navigate('/portal/overview');
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Invalid university email or password.';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        msg = 'Incorrect credentials. Please verify your email and password.';
      } else if (err.code === 'auth/user-disabled') {
        msg = 'This student account has been disabled. Please contact the campus administrator.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please wait a moment and try again or reset your password.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Network connection failure. Please verify your connection to Firebase services.';
      }
      setLoginError(msg);
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
            Student Sign In
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access your verified academic curriculum and campus maintenance portal.
          </p>
        </div>

        {loginError && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{loginError}</span>
          </div>
        )}

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="University Email"
              type="email"
              placeholder="e.g. yourname@institution.edu"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded text-brand-blue" defaultChecked />
                <span>Remember me</span>
              </label>
              <Link to="/auth/forgot-password" className="text-brand-blue font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              <span>Sign In with Firebase</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            Don&apos;t have an account yet?{' '}
            <Link to="/auth/register" className="font-bold text-brand-blue hover:underline">
              Register Student Account &rarr;
            </Link>
          </div>
        </Card>

        <div className="text-center">
          <Link
            to="/auth/admin-login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-500 transition-colors"
          >
            <span>Are you a faculty or estate administrator? Admin Login &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

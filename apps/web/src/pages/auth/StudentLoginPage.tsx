import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StudentLoginSchema, StudentLoginInput } from '@solvesphere/shared';
import { useAuth } from '@/hooks/useAuthDemo';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles, ArrowRight, ShieldAlert, GraduationCap, AlertCircle, Info } from 'lucide-react';

export const StudentLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsStudent } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
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
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect credentials. Please verify your email and password.';
      }
      setLoginError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = async () => {
    setIsSubmitting(true);
    try {
      await loginAsStudent();
      navigate('/portal/overview');
    } catch (err: any) {
      setLoginError(err.message || 'Demo student sign in failed.');
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

        {/* 1-Click Instant Demo Button */}
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-brand-blue dark:text-blue-300 space-y-2.5">
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="w-4 h-4 shrink-0" />
            <span>Firebase Authentication</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Use your registered credentials or 1-click test fill to sign in via Firebase Auth:
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full text-xs font-bold"
            onClick={handleDemoFill}
            disabled={isSubmitting}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-blue" />
            1-Click Sign In as Student (Aarav Sharma)
          </Button>
        </div>

        {loginError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{loginError}</span>
          </div>
        )}

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="University Email"
              type="email"
              placeholder="e.g. aarav.sharma@campus.edu"
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
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Are you a faculty or estate administrator? Admin Login &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

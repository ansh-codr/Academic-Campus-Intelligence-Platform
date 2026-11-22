import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminLoginSchema, AdminLoginInput } from '@solvesphere/shared';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldAlert, ArrowRight, AlertCircle, Info } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(AdminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AdminLoginInput) => {
    setIsSubmitting(true);
    setLoginError(null);
    try {
      const profile = await login(data.email, data.password);
      if (profile.role !== 'ADMIN') {
        await logout();
        throw new Error('Access denied. This account does not possess verified administrator credentials.');
      }
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Admin login error:', err);
      let msg = err.message || 'Authentication failed or account lacks admin permissions.';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        msg = 'Incorrect administrative credentials. Please verify your email and password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please wait a moment and try again.';
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white mx-auto shadow-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Administrative Portal Sign In
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Restricted access for academic affairs coordinators and estate maintenance dispatchers.
          </p>
        </div>

        {/* Security Warning Notice */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Administrator accounts require cryptographically verified custom claims (<code className="font-mono">role: &apos;ADMIN&apos;</code>). Public self-assignment is strictly blocked.
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
              label="Staff / Administrator Email"
              type="email"
              placeholder="e.g. admin@institution.edu"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Administrative Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
              isLoading={isSubmitting}
            >
              <span>Access Admin Command</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            Student looking for your class portal?{' '}
            <Link to="/auth/login" className="font-bold text-brand-blue hover:underline">
              Student Sign In &rarr;
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

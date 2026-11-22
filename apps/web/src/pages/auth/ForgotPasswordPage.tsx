import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KeyRound, CheckCircle, ArrowLeft, AlertCircle, Info } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await resetPassword(email);
      setIsSent(true);
    } catch (err: any) {
      console.error('Password reset notice:', err);
      // To prevent account enumeration, return neutral response
      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-brand-blue flex items-center justify-center mx-auto shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your university email address to receive password recovery instructions via Firebase Auth.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {isSent ? (
            <div className="space-y-4 text-center py-4">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Password Recovery Dispatched
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                If an account exists for <strong>{email}</strong>, a recovery link has been generated via Firebase Authentication.
              </p>
              <Link to="/auth/login">
                <Button variant="outline" size="sm" className="mt-2">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Return to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                label="Registered University Email"
                type="email"
                placeholder="your.name@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full mt-2"
                isLoading={isSubmitting}
              >
                Send Password Reset Email
              </Button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            Remembered your credentials?{' '}
            <Link to="/auth/login" className="font-bold text-brand-blue hover:underline">
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GraduationCap, ArrowRight, ShieldCheck, AlertCircle, Building2, BookOpen } from 'lucide-react';

const CompleteProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  studentId: z
    .string()
    .min(3, 'Student ID must be at least 3 characters')
    .max(25, 'Student ID must not exceed 25 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Student ID may only contain letters, numbers, hyphens, and underscores'),
  department: z.string().min(2, 'Please select or enter your academic department'),
  semester: z.coerce.number().int().min(1, 'Semester must be between 1 and 8').max(8, 'Semester must be between 1 and 8'),
});

type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>;

const POPULAR_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Artificial Intelligence & Data Science',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Biotechnology',
];

export const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompleteProfileInput>({
    resolver: zodResolver(CompleteProfileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      studentId: user?.studentId || '',
      department: user?.department || 'Computer Science & Engineering',
      semester: user?.semester || 1,
    },
  });

  const onSubmit = async (data: CompleteProfileInput) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updateProfile({
        fullName: data.fullName.trim(),
        studentId: data.studentId.trim(),
        department: data.department.trim(),
        semester: data.semester,
      });
      navigate('/portal/overview', { replace: true });
    } catch (err: any) {
      console.error('Failed to complete profile:', err);
      setSubmitError(err.message || 'Failed to save student profile details. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center text-white mx-auto shadow-glow-blue">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Complete Student Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Link your authentic university enrollment number to your Google account.
          </p>
        </div>

        {/* Institutional Verification Notice */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-bold">Institution Roster Synchronization Notice:</p>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
              Provide your authentic campus enrollment ID. Self-submitted student credentials are recorded for curriculum mapping and remain pending official institutional roster verification.
            </p>
          </div>
        </div>

        {submitError && (
          <div role="alert" className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
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
              label="Student ID / Enrollment Number"
              placeholder="e.g. STU-2026-1042"
              error={errors.studentId?.message}
              helperText="Assigned by university administration. Once set, cannot be altered."
              {...register('studentId')}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Department / Program
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  list="departments-list"
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all"
                  {...register('department')}
                />
                <datalist id="departments-list">
                  {POPULAR_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
              </div>
              {errors.department && (
                <p role="alert" className="text-xs text-rose-500 font-medium">{errors.department.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Current Semester (1 – 8)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min={1}
                  max={8}
                  placeholder="e.g. 1"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all"
                  {...register('semester')}
                />
              </div>
              {errors.semester && (
                <p role="alert" className="text-xs text-rose-500 font-medium">{errors.semester.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full mt-4"
              isLoading={isSubmitting}
            >
              <span>Save & Launch Student Portal</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

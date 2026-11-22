import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
} from 'lucide-react';

const CompleteProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  studentId: z
    .string()
    .min(4, 'Enrollment number must be at least 4 characters')
    .max(30, 'Enrollment number must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Enrollment number may only contain letters, numbers, hyphens, and underscores'),
  department: z.string().min(2, 'Please select or enter your academic department'),
  semester: z.coerce.number().int().min(1, 'Semester must be between 1 and 12').max(12, 'Semester must be between 1 and 12'),
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
  const { user, submitEnrollmentRequest } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditingPending, setIsEditingPending] = useState(false);

  const isPending = user?.enrollmentStatus === 'PENDING';
  const isRejected = user?.enrollmentStatus === 'REJECTED';
  const isVerified = user?.enrollmentStatus === 'VERIFIED';

  const {
    register,
    handleSubmit,
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
      await submitEnrollmentRequest({
        fullName: data.fullName.trim(),
        studentId: data.studentId.trim(),
        department: data.department.trim(),
        semester: data.semester,
      });
      setIsEditingPending(false);
    } catch (err: any) {
      console.error('Failed to submit enrollment request:', err);
      setSubmitError(err.message || 'Failed to submit enrollment verification request. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already verified, allow entering portal directly
  if (isVerified) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Institutional Enrollment Verified</h1>
            <p className="text-xs text-slate-500 mt-1">
              Your official enrollment (<span className="font-mono font-semibold text-emerald-600">{user.studentId}</span>) has been approved by university administration.
            </p>
          </div>
          <Button variant="gradient" className="w-full" onClick={() => navigate('/portal/overview', { replace: true })}>
            <span>Go to Student Portal</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Card>
      </div>
    );
  }

  // Pending verification view
  if (isPending && !isEditingPending) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800 shadow-sm">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Institutional Enrollment Under Review
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your enrollment details have been submitted for university roster verification.
            </p>
          </div>

          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verification Status</span>
              <Badge variant="amber">
                PENDING APPROVAL
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500">Student Name</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{user?.fullName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500">Academic Department</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{user?.department || 'Pending'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/60">
                <span className="text-slate-500">Current Semester</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">Semester {user?.semester || 1}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your university administration reviews submitted credentials against the official institution roll. While review is pending, you may browse general course overviews, but protected features (such as maintenance ticket dispatch and official grading) remain locked.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => setIsEditingPending(true)}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                <span>Correct Submitted Details</span>
              </Button>
              <Button
                variant="primary"
                className="w-full text-xs"
                onClick={() => navigate('/portal/overview')}
              >
                <span>Enter Portal (Restricted Mode)</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Active form view (INCOMPLETE, REJECTED, or editing PENDING)
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center text-white mx-auto shadow-glow-blue">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {isRejected ? 'Resubmit Enrollment Request' : 'Complete Student Profile'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your official enrollment number. Your university must verify this information before approval.
          </p>
        </div>

        {/* Rejection Notification if previously rejected */}
        {isRejected && (
          <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-100">
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Prior Enrollment Request Rejected</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
              Reason recorded by administrator: <span className="font-semibold underline">{user?.rejectionReason || 'Institutional roster mismatch.'}</span>
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400">
              Please check your roll number and department, and submit an updated verification request below.
            </p>
          </div>
        )}

        {/* Institutional Verification Notice */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-bold">Official University Verification Notice:</p>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
              Enter your official enrollment number. Your university must verify this information before approval.
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
              label="Official Institutional Enrollment Number"
              placeholder="e.g. STU-2026-1042"
              error={errors.studentId?.message}
              helperText="Assigned by university administration. Verified against official roster."
              {...register('studentId')}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Department / Academic Program
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
                Current Semester (1 – 12)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min={1}
                  max={12}
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
              <span>Submit for Official Verification</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            {isEditingPending && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsEditingPending(false)}
              >
                Cancel
              </Button>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};

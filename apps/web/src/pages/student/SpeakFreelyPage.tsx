import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SpeakFreelySchema, SpeakFreelyInput, AnonymousReport } from '@solvesphere/shared';
import { CampusService } from '@/services/campusService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  CheckCircle,
  HelpCircle,
  EyeOff,
  Info,
} from 'lucide-react';

export const SpeakFreelyPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<AnonymousReport | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SpeakFreelyInput>({
    resolver: zodResolver(SpeakFreelySchema),
    defaultValues: {
      category: 'Student Welfare & Hostel Concerns',
      description: '',
      acknowledgeNotice: false,
    },
  });

  const onSubmit = async (data: SpeakFreelyInput) => {
    setIsSubmitting(true);
    try {
      const rep = await CampusService.submitSpeakFreely(data.category, data.description);
      setSubmittedReport(rep);
      reset();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm">Sensitive Reporting</Badge>
          <span className="text-xs text-slate-500 font-semibold">Privacy-First Channel</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Speak Freely
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          A confidential reporting portal for sensitive student concerns, hostel welfare, or campus grievances.
        </p>
      </div>

      {/* Mandatory Explicit Security & Privacy Boundary Notice */}
      <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-2">
        <div className="flex items-center gap-2 font-extrabold text-sm text-amber-700 dark:text-amber-400">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>IMPORTANT PRIVACY &amp; SECURITY ADVISORY (PHASE 1)</span>
        </div>
        <p className="text-xs leading-relaxed">
          <strong>Notice:</strong> Complete cryptographically verified zero-knowledge anonymity, tamper-proof audit trails, and encrypted identity stripping require a specialized backend compliance implementation scheduled for Phase 2.
        </p>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          During this Phase 1 demonstration, this interface illustrates the student-facing workflow and tracking code generation without promising production-grade anonymity.
        </p>
      </div>

      {submittedReport && (
        <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in zoom-in-95">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span>Concern Recorded with Tracking Code</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Keep this tracking code to check status anonymously:
          </p>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 inline-block">
            {submittedReport.trackingCode}
          </div>
          <p className="text-xs text-slate-400">
            Status: {submittedReport.status} &bull; Privacy Level: {submittedReport.privacyLevel}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSubmittedReport(null)}
          >
            Submit Another Concern
          </Button>
        </div>
      )}

      {/* Form */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Select
            label="Concern Category"
            error={errors.category?.message}
            options={[
              { value: 'Student Welfare & Hostel Concerns', label: 'Hostel Safety & Living Conditions' },
              { value: 'Harassment & Ragging Prohibition', label: 'Harassment / Discrimination / Bullying' },
              { value: 'Academic Fairness & Evaluation Grievance', label: 'Academic Fairness / Evaluation Grievance' },
              { value: 'Mental Well-being & Counseling Referral', label: 'Mental Well-being & Counseling Referral' },
              { value: 'Other Sensitive Matter', label: 'Other Sensitive Matter' },
            ]}
            {...register('category')}
          />

          <Textarea
            label="Detailed Description of the Concern"
            rows={5}
            placeholder="Share what occurred, when it happened, and any supporting facts. Do not include your name if you wish to remain unidentified..."
            error={errors.description?.message}
            helperText="Minimum 20 characters. Please be descriptive."
            {...register('description')}
          />

          {/* Explicit Acknowledgment Checkbox */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="ack"
                className="mt-1 rounded text-amber-500 focus:ring-amber-500"
                {...register('acknowledgeNotice')}
              />
              <label htmlFor="ack" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                I understand that this is a <strong>Phase 1 preview channel</strong> and that full zero-knowledge cryptographic encryption will be deployed following security certification in Phase 2.
              </label>
            </div>
            {errors.acknowledgeNotice && (
              <p className="text-xs text-rose-500 font-semibold">{errors.acknowledgeNotice.message}</p>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              isLoading={isSubmitting}
            >
              <EyeOff className="w-4 h-4 mr-1.5" />
              <span>Submit Sensitive Concern</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

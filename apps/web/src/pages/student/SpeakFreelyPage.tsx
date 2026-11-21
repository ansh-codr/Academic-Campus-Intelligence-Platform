import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  ArrowRight,
} from 'lucide-react';

export const SpeakFreelyPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SpeakFreelyInput>({
    resolver: zodResolver(SpeakFreelySchema),
    defaultValues: {
      category: 'Student Welfare & Hostel Concerns',
      description: '',
      acknowledgeNotice: false,
    },
  });

  const onSubmit = async () => {
    setSubmissionNotice(
      'Live submissions are disabled for security compliance pending cryptographic privacy certification. Please use the official authenticated portal to submit campus issues.'
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="rose" size="sm">Privacy Architecture Advisory</Badge>
          <span className="text-xs text-slate-500 font-semibold">Security Compliance Notice</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Speak Freely
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          A confidential reporting portal for sensitive student concerns, hostel welfare, or campus grievances.
        </p>
      </div>

      {/* Mandatory Security & Privacy Compliance Boundary Notice */}
      <div className="p-5 rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-900 dark:text-rose-200 space-y-3">
        <div className="flex items-center gap-2 font-extrabold text-sm text-rose-700 dark:text-rose-400">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>LIVE SUBMISSIONS DISABLED PENDING ZERO-KNOWLEDGE AUDIT</span>
        </div>
        <p className="text-xs leading-relaxed">
          <strong>Security Notice:</strong> To ensure complete protection of student identities, live transmissions through Speak Freely are currently disabled until a documented, cryptographically certified zero-knowledge anonymization architecture is deployed.
        </p>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          We do not claim verified anonymity without rigorous mathematical guarantees. For urgent facilities, safety, or academic grievances, please use the official authenticated Campus Issue Reporting portal where tickets are handled by verified campus operations staff.
        </p>
        <div className="pt-1">
          <Link to="/portal/report">
            <Button size="sm" variant="gradient">
              <span>Go to Campus Issue Reporting</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {submissionNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>{submissionNotice}</span>
        </div>
      )}

      {/* Form (Disabled for security) */}
      <Card className="p-6 sm:p-8 opacity-80">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Select
            label="Concern Category (Preview)"
            disabled
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
            label="Detailed Description of the Concern (Preview)"
            disabled
            rows={5}
            placeholder="Live transmissions are disabled pending privacy certification..."
            {...register('description')}
          />

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="outline"
              size="lg"
              disabled
              className="cursor-not-allowed text-slate-400 border-slate-300 dark:border-slate-700"
            >
              <Lock className="w-4 h-4 mr-1.5" />
              <span>Submissions Disabled for Privacy Compliance</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

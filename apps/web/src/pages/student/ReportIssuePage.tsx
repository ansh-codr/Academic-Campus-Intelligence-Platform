import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTicketSchema, CreateTicketInput } from '@solvesphere/shared';
import { CampusService } from '@/services/campusService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  PlusCircle,
  Building2,
  Paperclip,
  CheckCircle,
  AlertCircle,
  Info,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(CreateTicketSchema),
    defaultValues: {
      category: 'AC_HVAC',
      priority: 'MEDIUM',
      building: '',
      floor: '',
      room: '',
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateTicketInput) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await CampusService.createTicket(data);
      setSubmissionSuccess(result);
      reset();
    } catch (err: any) {
      console.error('Error submitting complaint to Firestore:', err);
      setSubmitError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="sm">Smart Ticketing</Badge>
          <span className="text-xs text-slate-500 font-semibold">Campus Facilities &amp; Maintenance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Report a Campus Issue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Submit equipment faults, connectivity failures, or physical damage with precise building and room coordinates.
        </p>
      </div>

      {/* Cloud Firestore Persistence Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3 text-xs text-brand-blue dark:text-blue-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong className="block mb-0.5">Cloud Firestore Persistent Submission:</strong>
          Tickets are securely written to Cloud Firestore with atomic reference generation (e.g. <code className="font-mono">SS-2026-XXXX</code>) and real-time state tracking.
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {submissionSuccess && (
        <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in zoom-in-95">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span>Ticket Successfully Stored in Firestore!</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Reference Number: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{submissionSuccess.ticket.referenceNumber}</strong>
          </p>
          <p className="text-xs text-slate-500">
            Assigned to: <strong>{submissionSuccess.ticket.assignedDepartment}</strong> &bull; Priority: {submissionSuccess.ticket.priority} &bull; Status: {submissionSuccess.ticket.status}
          </p>
          <div className="pt-2 flex gap-3">
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate('/portal/tickets')}
            >
              Track in My Tickets &rarr;
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSubmissionSuccess(null)}
            >
              Submit Another Report
            </Button>
          </div>
        </div>
      )}

      {/* Form Card */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Issue Title */}
          <Input
            label="Issue Title"
            placeholder="e.g. Split AC leaking water during lecture in Hall 204"
            error={errors.title?.message}
            helperText="Provide a clear, brief headline summarizing the problem."
            {...register('title')}
          />

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Issue Category"
              error={errors.category?.message}
              options={[
                { value: 'AC_HVAC', label: 'AC / Climate Control' },
                { value: 'WIFI_NETWORK', label: 'Wi-Fi & Network Connectivity' },
                { value: 'ELECTRICAL', label: 'Electrical & Lighting' },
                { value: 'HOSTEL', label: 'Hostel Maintenance' },
                { value: 'WATER_SUPPLY', label: 'Water Supply & Plumbing' },
                { value: 'SANITATION', label: 'Cleanliness & Sanitation' },
                { value: 'GENERAL_INFRASTRUCTURE', label: 'General Infrastructure' },
              ]}
              {...register('category')}
            />

            <Select
              label="Priority Suggestion"
              error={errors.priority?.message}
              options={[
                { value: 'LOW', label: 'Low (Minor cosmetic / non-blocking)' },
                { value: 'MEDIUM', label: 'Medium (Standard maintenance)' },
                { value: 'HIGH', label: 'High (Disrupts classes or exams)' },
                { value: 'URGENT', label: 'Urgent (Safety hazard / water breach)' },
              ]}
              {...register('priority')}
            />
          </div>

          {/* Location Coordinates: Building, Floor, Room */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-cyan" />
              Location Coordinates
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Building"
                placeholder="e.g. Engineering Block A"
                error={errors.building?.message}
                {...register('building')}
              />
              <Input
                label="Floor"
                placeholder="e.g. 2nd Floor"
                error={errors.floor?.message}
                {...register('floor')}
              />
              <Input
                label="Room / Lab"
                placeholder="e.g. Hall 204 or East Wing"
                error={errors.room?.message}
                {...register('room')}
              />
            </div>
          </div>

          {/* Detailed Description */}
          <Textarea
            label="Detailed Description"
            rows={4}
            placeholder="Describe what is failing, any safety concerns, and the best time for technicians to inspect..."
            error={errors.description?.message}
            helperText="Minimum 15 characters. Clear descriptions speed up technician dispatch."
            {...register('description')}
          />

          {/* Attachment UI Dropzone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Photo / Attachment (Cloud Storage)
            </label>
            <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-2 hover:border-brand-blue/50 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-900/30">
              <Paperclip className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Click or drag photos of damaged equipment here
              </p>
              <p className="text-[11px] text-slate-400">
                PNG, JPG or PDF up to 10MB (Validated by Storage Security Rules)
              </p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => reset()}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              isLoading={isSubmitting}
            >
              <span>Submit Issue Report</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

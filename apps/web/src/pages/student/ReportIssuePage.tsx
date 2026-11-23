import type { z } from 'zod';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTicketSchema, CreateTicketInput, AiAssistComplaintResponse, TicketCategory, TicketPriority } from '@solvesphere/shared';
import { CampusService } from '@/services/campusService';
import { CampusCareService } from '@/services/campusCareService';
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
  Sparkles,
  Wrench,
  Check,
} from 'lucide-react';

export const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [omittedFiles, setOmittedFiles] = useState<string[]>([]);
  const [showEnrollmentLink, setShowEnrollmentLink] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // AI Assist States
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiAssistComplaintResponse | null>(null);
  const [aiAssistError, setAiAssistError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<z.input<typeof CreateTicketSchema>, unknown, CreateTicketInput>({
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

  // Watch fields for AI assist
  const currentTitle = watch('title');
  const currentDescription = watch('description');
  const currentBuilding = watch('building');
  const currentFloor = watch('floor');
  const currentRoom = watch('room');

  // Handle prefill from Campus Care AI draft
  useEffect(() => {
    const prefill = (location.state as any)?.prefillDraft;
    if (prefill) {
      if (prefill.title) setValue('title', prefill.title);
      if (prefill.description) setValue('description', prefill.description);
      if (prefill.category) setValue('category', prefill.category);
      if (prefill.building) setValue('building', prefill.building);
      if (prefill.floor) setValue('floor', prefill.floor);
      if (prefill.room) setValue('room', prefill.room);
      if (prefill.priority) setValue('priority', prefill.priority);
    }
  }, [location.state, setValue]);

  const handleAiAssist = async () => {
    const rawText = (currentDescription || currentTitle || '').trim();
    if (!rawText) {
      setAiAssistError('Please type a brief title or description first to enable AI enhancement.');
      return;
    }

    setIsAiAssisting(true);
    setAiAssistError(null);
    try {
      const res = await CampusCareService.aiAssistComplaint({
        rawInput: rawText,
        building: currentBuilding || undefined,
        floor: currentFloor || undefined,
        room: currentRoom || undefined,
      });
      setAiSuggestion(res);
    } catch (err: any) {
      console.warn('AI Assist error:', err);
      setAiAssistError(err.message || 'AI Enhancement failed. You can continue submitting manually.');
    } finally {
      setIsAiAssisting(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.suggestedTitle) setValue('title', aiSuggestion.suggestedTitle);
    if (aiSuggestion.enhancedDescription) setValue('description', aiSuggestion.enhancedDescription);
    if (aiSuggestion.suggestedCategory) setValue('category', aiSuggestion.suggestedCategory as TicketCategory);
    if (aiSuggestion.suggestedPriority) setValue('priority', aiSuggestion.suggestedPriority as TicketPriority);
    setAiSuggestion(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 10MB limit and will be skipped.`);
          return false;
        }
        return true;
      });
      if (validFiles.length + selectedFiles.length > 5) alert('You can attach up to five files.');
      setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateTicketInput) => {
    setIsSubmitting(true);
    setSubmissionSuccess(null);
    setShowEnrollmentLink(false);
    setOmittedFiles([]);
    setSubmitError(null);
    setUploadProgress(null);
    try {
      const uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploadProgress('Uploading attachments to secure storage...');
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          try {
            uploadedUrls.push(await CampusService.uploadAttachment(file));
          } catch {
            setOmittedFiles(prev => [...prev, file.name]);
          }
        }
      }

      setUploadProgress('Submitting complaint to Firestore...');
      const payload: CreateTicketInput = {
        ...data,
        attachmentUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      };

      const result = await CampusService.createTicket(payload);
      setSubmissionSuccess(result);
      setSelectedFiles([]);
      reset();
    } catch (err: any) {
      setShowEnrollmentLink(err.details?.reason === 'enrollment');
      setSubmitError(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
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

      {omittedFiles.length > 0 && <p role="status">These files could not be uploaded and were omitted: {omittedFiles.join(', ')}.</p>}
      {submitError && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{submitError} {showEnrollmentLink && <Link className="underline" to="/auth/complete-profile">View enrollment</Link>}</span>
        </div>
      )}

      {submissionSuccess && (
        <div role="status" className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-3 animate-in zoom-in-95">
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

          {/* Detailed Description with AI Enhancement Header */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Detailed Description
              </label>
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={isAiAssisting}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors shadow-sm"
              >
                <Sparkles className={`w-3.5 h-3.5 text-cyan-500 ${isAiAssisting ? 'animate-spin' : 'animate-pulse'}`} />
                <span>{isAiAssisting ? 'Enhancing with AI...' : 'Enhance with Campus Care AI'}</span>
              </button>
            </div>

            <Textarea
              rows={4}
              placeholder="Describe what is failing, any safety concerns, and the best time for technicians to inspect..."
              error={errors.description?.message}
              helperText="Minimum 15 characters. Clear descriptions speed up technician dispatch."
              {...register('description')}
            />

            {aiAssistError && (
              <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                {aiAssistError}
              </p>
            )}

            {/* AI Suggestion Preview Card */}
            {aiSuggestion && (
              <div className="p-4 rounded-2xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-800/80 space-y-3 animate-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    {aiSuggestion.provider === 'GEMINI_2_5_FLASH' || (!aiSuggestion.isMock && aiSuggestion.enhancementSource === 'GEMINI_AI')
                      ? 'Gemini 2.5 AI Assistant'
                      : 'Rule-Based Maintenance Suggestion'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {aiSuggestion.isMock || aiSuggestion.enhancementSource === 'RULE_BASED_ASSISTANCE' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60">
                        Rule-Based Assist
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60">
                        Gemini AI Active
                      </span>
                    )}
                    <Badge variant="cyan" size="sm">
                      {aiSuggestion.suggestedCategory}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                  <p>
                    <strong className="text-slate-500 dark:text-slate-400">Suggested Title:</strong>{' '}
                    <span className="font-semibold">{aiSuggestion.suggestedTitle}</span>
                  </p>
                  <p>
                    <strong className="text-slate-500 dark:text-slate-400">Enhanced Description:</strong>{' '}
                    <span>{aiSuggestion.enhancedDescription}</span>
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Target Dept: <strong className="text-slate-700 dark:text-slate-200">{aiSuggestion.suggestedDepartment}</strong></span>
                    <span>Priority: <strong className="text-amber-500">{aiSuggestion.suggestedPriority}</strong></span>
                  </div>

                  {aiSuggestion.missingInfo && aiSuggestion.missingInfo.length > 0 && (
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-700 dark:text-amber-300">
                      <strong>Missing details to confirm:</strong> {aiSuggestion.missingInfo.join(', ')}
                    </div>
                  )}
                </div>

                <div className="pt-1 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAiSuggestion(null)}
                    className="text-xs"
                  >
                    Dismiss
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleApplyAiSuggestion}
                    className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-semibold gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply AI Suggestions</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="attachment-input" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <Paperclip className="h-4 w-4 text-brand-blue" />
                <span>Add Photos / Attachments (Optional, max 10MB each)</span>
              </label>
              <input
                id="attachment-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('attachment-input')?.click()}
                className="text-xs"
              >
                Choose Files
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-rose-500 hover:text-rose-700 font-bold ml-2 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadProgress && (
              <p className="text-xs text-brand-blue dark:text-brand-cyan animate-pulse font-medium">
                {uploadProgress}
              </p>
            )}
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

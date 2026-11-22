import React, { useEffect, useState, useMemo } from 'react';
import { EnrollmentService } from '@/services/enrollmentService';
import { EnrollmentRequest, EnrollmentStatus } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Filter,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const AdminEnrollmentsPage: React.FC = () => {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'ALL' | EnrollmentStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection Modal
  const [rejectingRequest, setRejectingRequest] = useState<EnrollmentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRequests = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await EnrollmentService.getEnrollmentRequests();
      setRequests(data);
    } catch (err: any) {
      console.error('Error loading enrollment requests:', err);
      setFetchError(err.message || 'Failed to load enrollment requests from Cloud Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (req: EnrollmentRequest) => {
    setIsProcessing(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      await EnrollmentService.approveEnrollmentRequest(
        req.id,
        req.studentId,
        req.department,
        req.semester
      );
      setActionSuccess(`Enrollment ID "${req.studentId}" for ${req.fullName} verified and approved.`);
      await loadRequests();
    } catch (err: any) {
      console.error('Approval failed:', err);
      setActionError(err.message || 'Approval failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingRequest || !rejectionReason.trim()) return;
    setIsProcessing(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      await EnrollmentService.rejectEnrollmentRequest(
        rejectingRequest.id,
        rejectingRequest.studentId,
        rejectionReason.trim()
      );
      setActionSuccess(`Enrollment request for ${rejectingRequest.fullName} rejected.`);
      setRejectingRequest(null);
      setRejectionReason('');
      await loadRequests();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      setActionError(err.message || 'Rejection failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        r.fullName?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.studentId?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Student Enrollment Verification</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review and officially verify student enrollment IDs against institutional records.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadRequests}
          isLoading={isLoading}
          className="border-slate-700 text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Refresh Queue</span>
        </Button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div role="status" className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div role="alert" className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}
      {fetchError && (
        <div role="alert" className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
          {fetchError}
        </div>
      )}

      {/* Search & Filter Controls */}
      <Card className="p-4 bg-[#111a2e] border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b1220] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st === 'ALL' ? 'All Requests' : st}
                <span className="ml-1.5 text-[10px] opacity-75 font-mono">
                  {st === 'ALL'
                    ? requests.length
                    : requests.filter((r) => r.status === st).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading student verification queue...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="p-12 text-center bg-[#111a2e] border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No enrollment requests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'No requests matched your filter terms.'
              : 'There are no student enrollment verification submissions in this queue.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <Card
              key={req.id}
              className="p-5 bg-[#111a2e] border-slate-800 hover:border-slate-700 transition-colors space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-sm">
                    {req.fullName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{req.fullName}</span>
                      <Badge
                        variant={
                          req.status === 'VERIFIED'
                            ? 'green'
                            : req.status === 'REJECTED'
                            ? 'rose'
                            : 'amber'
                        }
                      >
                        {req.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-400">{req.email}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {req.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(req)}
                        disabled={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        <span>Approve</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectingRequest(req)}
                        disabled={isProcessing}
                        className="border-rose-800 text-rose-400 hover:bg-rose-950/50 text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        <span>Reject</span>
                      </Button>
                    </>
                  )}
                  {req.status === 'REJECTED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(req)}
                      disabled={isProcessing}
                      className="border-slate-700 text-slate-300 hover:text-white text-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Re-review & Approve</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Claimed Roll Number</span>
                  <span className="font-mono font-semibold text-amber-400">{req.studentId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Department</span>
                  <span className="text-slate-300 font-medium">{req.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Semester</span>
                  <span className="text-slate-300 font-medium">Semester {req.semester}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Submitted At</span>
                  <span className="text-slate-400 font-mono">
                    {req.submittedAt ? formatDate(req.submittedAt) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Review Audit / Rejection Reason */}
              {req.reviewedBy && (
                <div className="text-[11px] text-slate-400 bg-[#0b1220] p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span>
                    Reviewed by: <strong className="text-slate-300">{req.reviewedBy}</strong>
                  </span>
                  {req.reviewedAt && (
                    <span className="font-mono text-slate-500">
                      {formatDate(req.reviewedAt)}
                    </span>
                  )}
                </div>
              )}

              {req.rejectionReason && (
                <div className="text-xs text-rose-300 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/50">
                  <span className="font-bold block text-rose-400 mb-0.5">Rejection Reason:</span>
                  {req.rejectionReason}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectingRequest}
        onClose={() => setRejectingRequest(null)}
        title="Reject Enrollment Verification Request"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Please enter the official reason for rejecting{' '}
            <strong className="text-white">{rejectingRequest?.fullName}</strong>'s enrollment claim (
            <code className="text-amber-400">{rejectingRequest?.studentId}</code>). The student will see this note to correct and resubmit.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Rejection Reason <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Roll number CS26019 is not enrolled in Computer Science for 2026. Please check your admission slip."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-[#0b1220] border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectingRequest(null)}
              disabled={isProcessing}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
              isLoading={isProcessing}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

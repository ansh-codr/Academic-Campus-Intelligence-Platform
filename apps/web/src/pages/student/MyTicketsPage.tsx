import { externalFileUrl } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CampusService } from '@/services/campusService';
import { CampusTicket, TicketStatus } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Eye,
  PlusCircle,
  Radio,
  RotateCcw,
  Paperclip,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const MyTicketsPage: React.FC = () => {
  const { user, role } = useAuth();
  const [tickets, setTickets] = useState<CampusTicket[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<CampusTicket | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [reopenModalTicket, setReopenModalTicket] = useState<CampusTicket | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);
  const [reopenMessage, setReopenMessage] = useState<string | null>(null);
  const [reopenError, setReopenError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleReopenTicket = async () => {
    if (!reopenModalTicket || reopenReason.trim().length < 5) return;
    setIsReopening(true);
    setReopenMessage(null);
    setReopenError(null);
    try {
      await CampusService.reopenTicket(reopenModalTicket.id, reopenReason);
      setReopenMessage(`Ticket ${reopenModalTicket.referenceNumber} has been reopened successfully.`);
      setReopenModalTicket(null);
      setReopenReason('');
    } catch (err: any) {
      setReopenError(err.message || 'Error reopening ticket. Ensure ticket is resolved or closed.');
    } finally {
      setIsReopening(false);
    }
  };

  // Real-time Firestore subscription: updates automatically on changes
  useEffect(() => {
    const userId = role === 'ADMIN' ? undefined : user?.id;
    const unsubscribe = CampusService.subscribeTickets(
      (updatedTickets) => {
        setTickets(updatedTickets);
        setLoadError(null);
        // Also update selectedTicket if it is open in modal
        setSelectedTicket(current => current ? updatedTickets.find(t => t.id === current.id) ?? null : null);
      },
      userId,
      (err) => {
        console.error('Subscription error in MyTicketsPage:', err);
        setLoadError('Failed to synchronize campus tickets. Please check your network connection.');
      }
    );

    return () => unsubscribe();
  }, [user?.id, role]);

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return t.status !== 'RESOLVED' && t.status !== 'CLOSED';
    if (filterStatus === 'RESOLVED') return t.status === 'RESOLVED' || t.status === 'CLOSED';
    return t.status === filterStatus;
  });

  const LIFECYCLE_STEPS: { status: TicketStatus; label: string }[] = [
    { status: 'SUBMITTED', label: '1. Submitted' },
    { status: 'UNDER_REVIEW', label: '2. Under Review' },
    { status: 'ASSIGNED', label: '3. Assigned' },
    { status: 'IN_PROGRESS', label: '4. In Progress' },
    { status: 'RESOLVED', label: '5. Resolved' },
    { status: 'CLOSED', label: '6. Closed' },
  ];

  function getStepIndex(status: TicketStatus): number {
    return LIFECYCLE_STEPS.findIndex((s) => s.status === status);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm">Ticket History</Badge>
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Firestore Sync Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            My Maintenance Tickets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track the end-to-end resolution lifecycle, department assignments, and inspection logs.
          </p>
        </div>

        <Link to="/portal/report">
          <Button variant="gradient" size="md">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Report New Issue
          </Button>
        </Link>
      </div>

      {loadError && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {reopenMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{reopenMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs">
        {[
          { id: 'ALL', label: 'All Tickets' },
          { id: 'ACTIVE', label: 'Active / Pending' },
          { id: 'IN_PROGRESS', label: 'In Progress' },
          { id: 'RESOLVED', label: 'Resolved / Closed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              filterStatus === tab.id
                ? 'bg-white dark:bg-brand-cardDark text-brand-cyan shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <Ticket className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
              No tickets found in this view
            </h4>
            <p className="text-xs text-slate-500">
              Submit your first campus issue to begin tracking status in real time.
            </p>
            <Link to="/portal/report">
              <Button size="sm" variant="gradient">
                Create First Ticket
              </Button>
            </Link>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} hoverEffect className="p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs">
                      {ticket.referenceNumber}
                    </span>
                    <Badge
                      variant={
                        ticket.status === 'RESOLVED'
                          ? 'green'
                          : ticket.status === 'IN_PROGRESS'
                          ? 'blue'
                          : ticket.status === 'ASSIGNED'
                          ? 'cyan'
                          : 'amber'
                      }
                      size="sm"
                    >
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                    <Badge
                      variant={
                        ticket.priority === 'URGENT' || ticket.priority === 'HIGH'
                          ? 'rose'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {ticket.priority} Priority
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      Category: {ticket.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {ticket.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {ticket.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {ticket.building} &bull; {ticket.room}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Submitted: {formatDate(ticket.submittedAt)}
                    </span>
                    <span>
                      Dept: <strong>{ticket.assignedDepartment}</strong>
                    </span>
                  </div>
                </div>

                {/* View Details Action */}
                <div className="shrink-0 flex lg:flex-col justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-full sm:w-auto text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    View Timeline
                  </Button>
                  {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReopenModalTicket(ticket)}
                      className="w-full sm:w-auto text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Reopen Ticket
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Ticket Details & Lifecycle Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title={`Ticket: ${selectedTicket?.referenceNumber || ''}`}
        description={selectedTicket?.title}
        maxWidth="xl"
      >
        {selectedTicket && (
          <div className="space-y-6 text-xs sm:text-sm">
            {/* Visual Lifecycle Stepper */}
            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">
                Lifecycle Progression
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const currentIdx = getStepIndex(selectedTicket.status);
                  const isPassed = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={step.status}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                        isCurrent
                          ? 'bg-brand-blue text-white border-brand-blue shadow-glow-blue'
                          : isPassed
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      {step.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ticket Attributes */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">LOCATION</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedTicket.building}, {selectedTicket.floor}, {selectedTicket.room}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">ASSIGNED DEPARTMENT</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedTicket.assignedDepartment}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">SUBMITTED BY</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedTicket.submittedBy}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">LAST UPDATED</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatDate(selectedTicket.updatedAt)}
                </span>
              </div>
            </div>

            {/* Event Timeline History */}
            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                Audit Timeline Log (Firestore Subcollection)
              </h5>
              <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                {selectedTicket.timeline && selectedTicket.timeline.length > 0 ? (
                  selectedTicket.timeline.map((ev) => (
                    <div key={ev.id} className="relative space-y-1">
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-blue" />
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-brand-blue dark:text-cyan-400">{ev.status}</span>
                        <span className="text-[11px] text-slate-400">{formatDate(ev.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{ev.note}</p>
                      <p className="text-[10px] text-slate-400">By: {ev.updatedBy}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Initial submission logged.</p>
                )}
              </div>
            </div>

            {/* Attachments Display */}
            {selectedTicket.attachmentUrls && selectedTicket.attachmentUrls.length > 0 && (
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  Attached Photos / Files ({selectedTicket.attachmentUrls.length})
                </h5>
                <div className="flex flex-wrap gap-2">
                  {selectedTicket.attachmentUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={externalFileUrl(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-brand-blue dark:text-cyan-400 hover:underline text-xs"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Attachment #{idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center">
              {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const t = selectedTicket;
                    setSelectedTicket(null);
                    setReopenModalTicket(t);
                  }}
                  className="text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Reopen This Ticket
                </Button>
              ) : <div />}
              <Button variant="outline" size="sm" onClick={() => setSelectedTicket(null)}>
                Close Details
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reopen Ticket Modal */}
      <Modal
        isOpen={!!reopenModalTicket}
        onClose={() => {
          setReopenModalTicket(null);
          setReopenError(null);
        }}
        title={`Reopen Ticket: ${reopenModalTicket?.referenceNumber || ''}`}
        description="Provide a justification why this issue requires renewed technician intervention."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          {reopenError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <strong>Error:</strong> {reopenError}
            </div>
          )}
          <p className="text-slate-600 dark:text-slate-300">
            Please explain why this issue is not fully resolved or if the recurring problem reappeared:
          </p>
          <textarea
            value={reopenReason}
            onChange={(e) => {
              setReopenReason(e.target.value);
              if (reopenError) setReopenError(null);
            }}
            placeholder="e.g. The leak resumed after 2 hours of heavy AC usage..."
            rows={4}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReopenModalTicket(null);
                setReopenReason('');
                setReopenError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="sm"
              disabled={reopenReason.trim().length < 5 || isReopening}
              isLoading={isReopening}
              onClick={handleReopenTicket}
            >
              Submit Reopen Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { AdminService } from '@/services/adminService';
import { CampusService } from '@/services/campusService';
import { IssueCluster, CampusTicket, TicketStatus, CampusDepartment } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import {
  Network,
  CheckCircle,
  AlertTriangle,
  Flame,
  ArrowRight,
  Info,
  Layers,
  Wrench,
  Building2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const AdminComplaintsClustersPage: React.FC = () => {
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [tickets, setTickets] = useState<CampusTicket[]>([]);
  const [departments, setDepartments] = useState<CampusDepartment[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<IssueCluster | null>(null);
  const [selectedTicketForUpdate, setSelectedTicketForUpdate] = useState<CampusTicket | null>(null);
  const [newStatus, setNewStatus] = useState<TicketStatus>('IN_PROGRESS');
  const [newDepartment, setNewDepartment] = useState('HVAC & Climate Control');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubClusters = CampusService.subscribeClusters(setClusters);
    const unsubTickets = CampusService.subscribeTickets(setTickets);
    const unsubDepts = CampusService.subscribeDepartments((depts) => {
      setDepartments(depts.filter((d) => d.isActive));
      if (depts.length > 0 && !newDepartment) {
        setNewDepartment(depts[0].name);
      }
    });

    return () => {
      unsubClusters();
      unsubTickets();
      unsubDepts();
    };
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedTicketForUpdate) return;
    setIsUpdating(true);
    setActionSuccess(null);
    try {
      await AdminService.updateTicketStatus(
        selectedTicketForUpdate.id,
        newStatus,
        statusNote || `Status updated to ${newStatus} via Admin Triage.`
      );
      setActionSuccess(`Ticket ${selectedTicketForUpdate.referenceNumber} status updated to ${newStatus}.`);
      setSelectedTicketForUpdate(null);
      setStatusNote('');
    } catch (err: any) {
      alert(`Error updating ticket status: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignDepartment = async () => {
    if (!selectedTicketForUpdate) return;
    setIsUpdating(true);
    setActionSuccess(null);
    try {
      await AdminService.assignTicketDepartment(
        selectedTicketForUpdate.id,
        newDepartment,
        `Assigned to ${newDepartment} by central administrator.`
      );
      setActionSuccess(`Ticket ${selectedTicketForUpdate.referenceNumber} assigned to ${newDepartment}.`);
      setSelectedTicketForUpdate(null);
    } catch (err: any) {
      alert(`Error assigning ticket: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="amber" size="sm">Admin Triage Operations</Badge>
          <span className="text-xs text-slate-400 font-semibold">Real-Time Cloud Firestore Sync</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
          Complaints Management &amp; Issue Clusters
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Assign tickets to campus maintenance departments, manage status transitions, and inspect semantic duplicate clusters.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 font-semibold animate-in zoom-in-95">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Real-Time Live Complaints Table */}
      <Card className="p-6 bg-slate-950 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              All Active Campus Complaints ({tickets.length})
            </h3>
            <p className="text-xs text-slate-400">
              Live updates stream directly from Cloud Firestore
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Firestore Listener
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="pb-3">Reference</th>
                <th className="pb-3">Title &amp; Submitter</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Submitted</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {tickets.map((tkt) => (
                <tr key={tkt.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 font-mono font-bold text-amber-400">
                    {tkt.referenceNumber}
                  </td>
                  <td className="py-3">
                    <p className="font-semibold text-white max-w-xs truncate">{tkt.title}</p>
                    <p className="text-[10px] text-slate-400">By: {tkt.submittedBy}</p>
                  </td>
                  <td className="py-3 text-slate-400">
                    {tkt.building} ({tkt.room})
                  </td>
                  <td className="py-3 font-medium text-slate-300">
                    {tkt.assignedDepartment}
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={
                        tkt.status === 'RESOLVED'
                          ? 'green'
                          : tkt.status === 'IN_PROGRESS'
                          ? 'blue'
                          : tkt.status === 'ASSIGNED'
                          ? 'cyan'
                          : 'amber'
                      }
                      size="sm"
                    >
                      {tkt.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 text-slate-400">
                    {formatDate(tkt.submittedAt)}
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-amber-400 border-slate-700 bg-slate-900"
                      onClick={() => {
                        setSelectedTicketForUpdate(tkt);
                        setNewStatus(tkt.status === 'SUBMITTED' ? 'UNDER_REVIEW' : tkt.status === 'UNDER_REVIEW' ? 'ASSIGNED' : 'IN_PROGRESS');
                      }}
                    >
                      Triage / Update &rarr;
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue Clusters Section */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">
          AI Semantic Issue Clusters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clusters.map((cluster) => (
            <Card key={cluster.id} className="p-6 bg-slate-950 border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="cyan" size="sm">{cluster.category}</Badge>
                <Badge variant="amber" size="sm">{cluster.ticketCount} Grouped Tickets</Badge>
              </div>

              <div>
                <h4 className="text-base font-bold text-white">{cluster.title}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  <strong>Affected Zone:</strong> {cluster.affectedArea}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-amber-400 block mb-0.5">
                  Consolidated Work Order Recommendation:
                </span>
                {cluster.suggestedAction}
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800">
                <span className="font-mono">Tickets: {cluster.ticketIds.join(', ')}</span>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                  onClick={() => setSelectedCluster(cluster)}
                >
                  <Wrench className="w-3.5 h-3.5 mr-1" />
                  Dispatch Master Order
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Ticket Triage / Update Status Modal */}
      <Modal
        isOpen={!!selectedTicketForUpdate}
        onClose={() => setSelectedTicketForUpdate(null)}
        title={`Triage Ticket: ${selectedTicketForUpdate?.referenceNumber || ''}`}
        description={selectedTicketForUpdate?.title}
        maxWidth="lg"
      >
        {selectedTicketForUpdate && (
          <div className="space-y-5 text-xs sm:text-sm text-slate-300">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <strong className="text-amber-400">{selectedTicketForUpdate.status}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Department:</span>
                <strong className="text-white">{selectedTicketForUpdate.assignedDepartment}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <strong className="text-white">{selectedTicketForUpdate.building} &bull; {selectedTicketForUpdate.room}</strong>
              </div>
            </div>

            {/* Action 1: Status Change */}
            <div className="space-y-3 pt-2">
              <h5 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                1. Advance Ticket Status
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                  <option value="REOPENED">REOPENED</option>
                </select>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                  onClick={handleUpdateStatus}
                  isLoading={isUpdating}
                >
                  Apply Status Update
                </Button>
              </div>
            </div>

            {/* Action 2: Reassign Department */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h5 className="font-bold text-xs uppercase tracking-wider text-brand-cyan">
                2. Reassign Department
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                >
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="HVAC & Climate Control">HVAC &amp; Climate Control</option>
                      <option value="IT & Campus Network Operations">IT &amp; Campus Network Operations</option>
                      <option value="Electrical Maintenance">Electrical Maintenance</option>
                      <option value="Public Health & Plumbing">Public Health &amp; Plumbing</option>
                      <option value="Campus Estate & General Infrastructure">Campus Estate &amp; General Infrastructure</option>
                      <option value="Hostel Administration Office">Hostel Administration Office</option>
                    </>
                  )}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-brand-cyan border-slate-700 bg-slate-900 font-bold"
                  onClick={handleAssignDepartment}
                  isLoading={isUpdating}
                >
                  Assign Department
                </Button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedTicketForUpdate(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Master Work Order Modal */}
      <Modal
        isOpen={!!selectedCluster}
        onClose={() => setSelectedCluster(null)}
        title={selectedCluster?.title || 'Cluster Action'}
        description="Consolidated Root Cause Work Order Dispatch"
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <p>
            You are creating a single root-cause dispatch order for{' '}
            <strong className="text-white">{selectedCluster?.ticketCount} tickets</strong> in{' '}
            {selectedCluster?.affectedArea}.
          </p>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 block font-semibold">RECOMMENDED ACTION:</span>
            <span className="text-white font-medium">{selectedCluster?.suggestedAction}</span>
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedCluster(null)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={async () => {
                if (selectedCluster) {
                  try {
                    await AdminService.reviewCluster(selectedCluster.id, 'resolve', 'Master work order dispatched by admin.');
                    setActionSuccess(`Master work order dispatched for "${selectedCluster.title}". Duplicate tickets grouped.`);
                  } catch (err: any) {
                    console.error('Error reviewing cluster:', err);
                  }
                  setSelectedCluster(null);
                }
              }}
            >
              Confirm Dispatch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

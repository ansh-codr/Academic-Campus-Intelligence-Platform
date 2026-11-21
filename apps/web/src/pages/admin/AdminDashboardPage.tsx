import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminService, AdminOverviewData } from '@/services/adminService';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  Network,
  Activity,
  ArrowRight,
  Info,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AdminService.getOverview().then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="amber" size="sm">Admin Command Hub</Badge>
            <span className="text-xs text-slate-400 font-semibold">Institutional Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Administrative Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time enrollment health, campus maintenance workload, and semantic issue cluster resolution.
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/admin/clusters">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
              <Network className="w-3.5 h-3.5 mr-1.5" />
              Triage AI Issue Clusters
            </Button>
          </Link>
        </div>
      </div>

      {/* Explicit Admin Preview Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <strong>Phase 1 Full-Stack Notice:</strong> This administrative shell visualizes campus workload, semester enrollment cohorts, and semantic cluster suggestions. Role-based authorization policies and live database transactions will connect in Phase 2.
        </div>
      </div>

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2 bg-slate-950 border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
            <span>ENROLLED STUDENTS</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">
            {data?.metrics.totalStudents.toLocaleString() ?? '—'}
          </p>
          <p className="text-xs text-slate-400">First-year engineering batch</p>
        </Card>

        <Card className="p-5 space-y-2 bg-slate-950 border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
            <span>OPEN COMPLAINTS</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400">
            {data?.metrics.openComplaints ?? '—'}
          </p>
          <p className="text-xs text-slate-400">
            {data?.metrics.pendingApprovals ?? '—'} awaiting triage review
          </p>
        </Card>

        <Card className="p-5 space-y-2 bg-slate-950 border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
            <span>RESOLUTION RATE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">
            {data?.metrics.resolutionRate ?? '—'}%
          </p>
          <p className="text-xs text-slate-400">
            {data?.metrics.resolvedComplaints ?? '—'} total issues solved
          </p>
        </Card>

        <Card className="p-5 space-y-2 bg-slate-950 border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
            <span>SEMANTIC CLUSTERS</span>
            <Network className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400">
            {data?.metrics.criticalClusters ?? '—'}
          </p>
          <p className="text-xs text-slate-400">Active root-cause work orders</p>
        </Card>
      </div>

      {/* Two-Column Section: Department Workload vs Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Workload */}
        <Card className="p-6 bg-slate-950 border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Department Workload Distribution
              </h3>
              <p className="text-xs text-slate-400">
                Active work orders and average SLA turnaround times
              </p>
            </div>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>

          <div className="space-y-4">
            {data?.departmentWorkload.map((dept) => (
              <div key={dept.department} className="space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-300">{dept.department}</span>
                  <span className="text-amber-400">
                    {dept.assignedCount} Active &bull; {dept.averageResolutionDays}d avg
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                    style={{ width: `${Math.min(dept.assignedCount * 8, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Admin Audit & Activity Stream */}
        <Card className="p-6 bg-slate-950 border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Live Audit &amp; Event Stream
              </h3>
              <p className="text-xs text-slate-400">
                Automated semantic cluster logs and faculty syllabus updates
              </p>
            </div>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>

          <div className="space-y-3">
            {data?.recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{act.title}</span>
                  <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                </div>
                <p className="text-slate-400 text-xs">{act.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Active AI Issue Clusters Summary Table */}
      <Card className="p-6 bg-slate-950 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              Active Root-Cause Issue Clusters
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated complaints grouped by semantic similarity
            </p>
          </div>
          <Link to="/admin/clusters" className="text-xs font-bold text-amber-400 hover:underline">
            Manage Clusters &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="pb-3">Cluster ID &amp; Incident</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Affected Zone</th>
                <th className="pb-3">Duplicates</th>
                <th className="pb-3">Confidence</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {data?.activeClusters.map((cluster) => (
                <tr key={cluster.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 font-semibold text-white">
                    {cluster.title}
                  </td>
                  <td className="py-3">
                    <Badge variant="cyan" size="sm">{cluster.category}</Badge>
                  </td>
                  <td className="py-3 text-slate-400">{cluster.affectedArea}</td>
                  <td className="py-3 font-mono font-bold text-amber-400">{cluster.ticketCount} reports</td>
                  <td className="py-3 font-mono text-emerald-400">
                    {Math.round(cluster.confidenceScore * 100)}%
                  </td>
                  <td className="py-3 text-right">
                    <Button size="sm" variant="outline" className="text-xs text-amber-400 border-slate-700 bg-slate-900">
                      Inspect &rarr;
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

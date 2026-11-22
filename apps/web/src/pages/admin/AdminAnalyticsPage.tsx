import React, { useEffect, useState } from 'react';
import { AdminService, AdminOverviewData } from '@/services/adminService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  BookOpen,
  Building2,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await AdminService.getOverview();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setErrorMsg(err.message || 'Failed to aggregate metrics from Cloud Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Institutional Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Genuine operational metrics computed directly from authentic Cloud Firestore collections.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          isLoading={isLoading}
          className="border-slate-700 text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Refresh Data</span>
        </Button>
      </div>

      {errorMsg && (
        <div role="alert" className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Aggregating institutional data points...</span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-[#111a2e] border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Registered Students</span>
                <Users className="w-4 h-4 text-brand-cyan" />
              </div>
              <p className="text-2xl font-extrabold text-white">{data.metrics.totalStudents}</p>
              <span className="text-[10px] text-slate-500">Authentic accounts</span>
            </Card>

            <Card className="p-5 bg-[#111a2e] border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Active Subjects</span>
                <BookOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{data.metrics.activeSubjects}</p>
              <span className="text-[10px] text-slate-500">Curriculum catalog</span>
            </Card>

            <Card className="p-5 bg-[#111a2e] border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Open Complaints</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{data.metrics.openComplaints}</p>
              <span className="text-[10px] text-slate-500">Pending maintenance</span>
            </Card>

            <Card className="p-5 bg-[#111a2e] border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Resolution Rate</span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{data.metrics.resolutionRate}%</p>
              <span className="text-[10px] text-slate-500">Resolved vs Total</span>
            </Card>
          </div>

          {/* Department Workload Distribution */}
          <Card className="p-6 bg-[#111a2e] border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Department Maintenance Workload</h3>
              </div>
              <span className="text-xs text-slate-400">{data.departmentWorkload.length} Active Departments</span>
            </div>

            {data.departmentWorkload.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No campus departments registered.</p>
            ) : (
              <div className="space-y-3">
                {data.departmentWorkload.map((dw) => {
                  const total = dw.assignedCount + dw.resolvedCount;
                  const pct = total ? Math.round((dw.resolvedCount / total) * 100) : 0;
                  return (
                    <div key={dw.department} className="space-y-1.5 p-3 rounded-xl bg-[#0b1220] border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{dw.department}</span>
                        <div className="flex items-center gap-3 text-slate-400">
                          <span>{dw.assignedCount} Pending</span>
                          <span>{dw.resolvedCount} Resolved</span>
                          <span className="font-mono font-bold text-emerald-400">{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
};

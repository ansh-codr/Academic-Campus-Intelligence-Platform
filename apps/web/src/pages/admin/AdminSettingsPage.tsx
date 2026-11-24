import { app } from '@/lib/firebase';
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Settings,
  Shield,
  Server,
  Database,
  Globe,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { user, role } = useAuth();
  const projectId = app.options.projectId;
  const authDomain = app.options.authDomain;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">System Settings & Infrastructure</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Review live platform configuration, Firebase service connections, and security policy status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Firebase Project Information */}
        <Card className="p-6 bg-[#111a2e] border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-800">
            <Server className="w-4 h-4 text-brand-cyan" />
            <span>Firebase Cloud Infrastructure</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Firebase Project ID</span>
              <span className="font-mono font-semibold text-white">{projectId}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Hosting Auth Domain</span>
              <span className="font-mono text-slate-300">{authDomain}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Firestore Location</span>
              <span className="font-mono text-slate-300">See Firestore console</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Current Plan</span>
              <Badge variant="amber">See billing console</Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/60 text-xs text-amber-300 leading-relaxed">
            <span className="font-bold block mb-1">Infrastructure Boundary:</span>
            Production Functions and Storage require a billing-enabled Firebase project.
          </div>
        </Card>

        {/* Security & Access Policy */}
        <Card className="p-6 bg-[#111a2e] border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white pb-2 border-b border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Security Model & RBAC Status</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Active Administrator</span>
              <span className="font-medium text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Verified Custom Claim</span>
              <span className="font-mono text-emerald-400 font-bold">&#123; role: "{role}" &#125;</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Security Rules Version</span>
              <span className="font-mono text-slate-300">v2 (Native Cloud Firestore)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Enrollment Integrity</span>
              <Badge variant="green">STRICT REVIEW ENABLED</Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-300 block mb-1">Institutional Protection:</span>
            Client accounts cannot self-assign student roll numbers or the ADMIN claim. All administrative mutations are guarded server-side by cryptographic token claims.
          </div>
        </Card>
      </div>
    </div>
  );
};

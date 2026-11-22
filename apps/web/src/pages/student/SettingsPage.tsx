import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Settings as SettingsIcon, Bell, Shield, Moon, Eye, Smartphone } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="sm">Configuration</Badge>
          <span className="text-xs text-slate-500 font-semibold">User Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Preferences &amp; Portal Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Customize your appearance and review available settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Moon className="w-4 h-4 text-brand-blue" />
            Appearance &amp; Theme
          </h3>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Light / Dark Theme Mode
              </p>
              <p className="text-xs text-slate-500">
                Toggle between high-contrast dark theme and clean off-white light mode.
              </p>
            </div>
            <ThemeToggle variant="outline" />
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-cyan" />
            Notification preferences (coming soon)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Automated notification preferences are not configured in this version.</p><div className="space-y-3 text-xs">
            <label className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer">
              <span>Notify me when a syllabus topic is marked completed by faculty</span>
              <input type="checkbox" disabled className="rounded text-brand-blue" />
            </label>
            <label className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer">
              <span>Real-time SMS / In-App alert when campus maintenance status updates</span>
              <input type="checkbox" disabled className="rounded text-brand-blue" />
            </label>
            <label className="flex items-center justify-between py-2 cursor-pointer">
              <span>Weekly digest of newly approved study materials</span>
              <input type="checkbox" disabled className="rounded text-brand-blue" />
            </label>
          </div>
        </Card>

        {/* Security & Access */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            Security &amp; Account Status
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Account authenticated securely via Firebase Identity Platform. Role and access permissions are managed directly by campus administrators.
          </p>
        </Card>
      </div>
    </div>
  );
};

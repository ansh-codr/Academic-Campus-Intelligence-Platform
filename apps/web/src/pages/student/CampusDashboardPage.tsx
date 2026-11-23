import { useAuth } from '@/hooks/useAuth';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CampusService } from '@/services/campusService';
import { CampusTicket, PublicCampusIncident } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  PlusCircle,
  Ticket,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldCheck,
  Megaphone,
  Radio,
  Sparkles,
} from 'lucide-react';

export const CampusDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<CampusTicket[]>([]);
  const [incidents, setIncidents] = useState<PublicCampusIncident[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const unsubTickets = CampusService.subscribeTickets(
      (t) => {
        setTickets(t);
        setLoadError(null);
      },
      user.id,
      (err) => {
        console.error('Tickets subscription error:', err);
        setLoadError('Failed to synchronize campus tickets.');
      }
    );
    const unsubIncidents = CampusService.subscribePublicIncidents(
      (inc) => {
        setIncidents(inc);
      },
      (err) => {
        setLoadError('Failed to synchronize campus incidents.');
      }
    );

    return () => {
      unsubTickets();
      unsubIncidents();
    };
  }, [user?.id]);

  const activeCount = tickets.filter(
    (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  ).length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header with Quick Report Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm">Module B</Badge>
            <span className="text-xs text-slate-500 font-semibold">Campus Infrastructure Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Campus Intelligence &amp; Maintenance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time infrastructure issue reporting, status lifecycle tracking, and smart clustering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/portal/campus-care">
            <Button
              variant="outline"
              size="md"
              className="gap-1.5 text-cyan-600 dark:text-cyan-400 border-cyan-500/40 hover:bg-cyan-50 dark:hover:bg-cyan-950/40"
            >
              <Sparkles className="w-4 h-4" />
              <span>Campus Care AI</span>
            </Button>
          </Link>
          <Link to="/portal/report">
            <Button variant="gradient" size="md">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Report New Campus Issue
            </Button>
          </Link>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-200 text-xs sm:text-sm flex items-center justify-between"
        >
          <span>{loadError}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>ACTIVE TICKETS</span>
            <Ticket className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{activeCount}</p>
          <p className="text-xs text-slate-500">Requires facility action</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>UNDER REPAIR / ON SITE</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{inProgressCount}</p>
          <p className="text-xs text-slate-500">Technicians assigned</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>RESOLVED ISSUES</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{resolvedCount}</p>
          <p className="text-xs text-slate-500">Verified by student sign-off</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>ACTIVE INCIDENTS</span>
            <Radio className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{incidents.length}</p>
          <p className="text-xs text-slate-500">Verified campus operations</p>
        </Card>
      </div>

      {/* Campus Announcements Preview Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Campus Estate Maintenance Advisory: Engineering Block A Chillers
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Central HVAC technicians are conducting planned coil flush on 2nd Floor Chiller-02 today from 2:00 PM – 5:00 PM. Room temperatures may fluctuate temporarily.
            </p>
          </div>
        </div>
        <Badge variant="amber" size="sm" className="hidden sm:inline-flex shrink-0">
          Estate Office
        </Badge>
      </div>

      {/* Two Column Layout: My Tickets vs AI Common Issue Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Active Tickets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Maintenance Reports
            </h2>
            <Link to="/portal/tickets" className="text-xs font-bold text-brand-blue dark:text-cyan-400 hover:underline">
              View All Tickets &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {tickets.slice(0, 4).map((tkt) => (
              <Card key={tkt.id} hoverEffect className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {tkt.referenceNumber}
                  </span>
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
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {tkt.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Location: {tkt.building} &bull; {tkt.room}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <span>Assigned: {tkt.assignedDepartment}</span>
                  <Link
                    to="/portal/tickets"
                    className="font-semibold text-brand-cyan hover:underline"
                  >
                    Details &rarr;
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Verified Campus Incidents (Privacy-Preserved for Students) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Active Campus Incidents
              </h2>
            </div>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
              Verified Operational Updates
            </span>
          </div>

          <div className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="p-5 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="cyan" size="sm">
                    {incident.category.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {incident.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {incident.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  <strong>Affected Zone:</strong> {incident.affectedArea}
                </p>

                <div className="p-3 rounded-xl bg-white dark:bg-brand-surfaceDark border border-purple-100 dark:border-purple-900 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-purple-700 dark:text-purple-400 block mb-0.5">
                    Incident Status &amp; Advisory:
                  </span>
                  {incident.summary}
                </div>

                <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1">
                  <span>Unified Incident &bull; {incident.ticketCount} reports verified</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Technician Dispatched
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Speak Freely Privacy Spotlight */}
          <Card className="p-5 border-l-4 border-l-amber-500 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                Sensitive Concern? Speak Freely
              </h4>
              <Link to="/portal/speak-freely">
                <Button variant="ghost" size="sm" className="text-xs text-amber-600">
                  Open Channel &rarr;
                </Button>
              </Link>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Report sensitive hostel, harassment, or student welfare matters through a dedicated, privacy-first interface.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

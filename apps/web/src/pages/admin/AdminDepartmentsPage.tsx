import React, { useEffect, useState } from 'react';
import { CampusService } from '@/services/campusService';
import { AdminService } from '@/services/adminService';
import { CampusDepartment, TicketCategory } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Building2,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Mail,
  UserCheck,
} from 'lucide-react';

const CATEGORIES: TicketCategory[] = [
  'GENERAL_INFRASTRUCTURE',
  'ELECTRICAL',
  'AC_HVAC',
  'WIFI_NETWORK',
  'WATER_SUPPLY',
  'HOSTEL',
  'SANITATION',
];

export const AdminDepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<CampusDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<CampusDepartment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<TicketCategory>('GENERAL_INFRASTRUCTURE');
  const [headName, setHeadName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsub = CampusService.subscribeDepartments(
      (depts) => {
        setDepartments(depts);
        setIsLoading(false);
        setLoadError(null);
      },
      (err) => {
        console.error('Failed to subscribe to departments:', err);
        setLoadError('Failed to load campus departments.');
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    setName('');
    setCode('');
    setCategory('GENERAL_INFRASTRUCTURE');
    setHeadName('');
    setContactEmail('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: CampusDepartment) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setCategory(dept.category || 'GENERAL_INFRASTRUCTURE');
    setHeadName(dept.headName || '');
    setContactEmail(dept.contactEmail || '');
    setIsActive(dept.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Department name and code are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingDept) {
        await AdminService.manageDepartment('update', editingDept.id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          category,
          headName: headName.trim(),
          contactEmail: contactEmail.trim(),
          isActive,
        });
      } else {
        await AdminService.manageDepartment('create', undefined, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          category,
          headName: headName.trim(),
          contactEmail: contactEmail.trim(),
          isActive,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to manage department:', err);
      alert(err?.message || 'Failed to save department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (dept: CampusDepartment) => {
    const actionLabel = dept.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} department "${dept.name}"?`)) return;

    try {
      await AdminService.manageDepartment('toggleActive', dept.id);
    } catch (err: any) {
      console.error('Failed to toggle department status:', err);
      alert(err?.message || 'Failed to update department status.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="amber" size="sm">Campus Operations</Badge>
            <span className="text-xs text-slate-400 font-semibold">Institutional Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Campus Departments &amp; Maintenance Units
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure real facilities departments for automated complaint routing, technician triage, and workload analytics.
          </p>
        </div>

        <Button variant="gradient" size="sm" onClick={openCreateModal} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Department
        </Button>
      </div>

      {/* Error state */}
      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-200 text-xs sm:text-sm flex items-center justify-between"
        >
          <span>{loadError}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          Loading verified institutional departments…
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-10 h-10" />}
          title="No campus departments registered"
          description="No official departments exist in Firestore yet. Register operational units to enable complaint routing."
          action={
            <Button size="sm" variant="gradient" onClick={openCreateModal}>
              Register Department
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept.id} className="p-5 bg-slate-950 border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <Badge variant={dept.isActive !== false ? 'green' : 'slate'} size="sm">
                    {dept.isActive !== false ? 'Active Unit' : 'Inactive'}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {dept.code}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{dept.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Category: {dept.category || 'General'}</p>
                </div>

                <div className="pt-2 border-t border-slate-900 space-y-1.5 text-xs text-slate-300">
                  {dept.headName && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{dept.headName}</span>
                    </div>
                  )}
                  {dept.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{dept.contactEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-900 flex justify-between items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(dept)}
                  className="text-xs text-slate-300 border-slate-800 hover:bg-slate-900"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(dept)}
                  className={`text-xs font-semibold ${
                    dept.isActive !== false
                      ? 'text-rose-400 hover:bg-rose-500/10'
                      : 'text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {dept.isActive !== false ? (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDept ? 'Edit Campus Department' : 'Register New Campus Department'}
          description="Provision or update an official infrastructure department in Cloud Firestore."
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Department Name</label>
              <Input
                placeholder="e.g. Electrical & Power Systems Maintenance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Code</label>
                <Input
                  placeholder="e.g. ELEC-MAINT"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Department Head</label>
                <Input
                  placeholder="e.g. Eng. Vikram Sharma"
                  value={headName}
                  onChange={(e) => setHeadName(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Dispatch Email</label>
                <Input
                  type="email"
                  placeholder="e.g. electrical-dispatch@campus.edu"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="dept-active-toggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="dept-active-toggle" className="font-semibold text-slate-300 cursor-pointer">
                Department active and eligible for complaint assignment
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingDept ? 'Save Changes' : 'Register Department'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

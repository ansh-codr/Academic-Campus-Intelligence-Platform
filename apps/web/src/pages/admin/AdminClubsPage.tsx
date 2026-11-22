import React, { useEffect, useState } from 'react';
import { CampusService } from '@/services/campusService';
import { AdminService } from '@/services/adminService';
import { CampusClub } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Sparkles,
  Plus,
  Edit2,
  Archive,
  Mail,
  Users,
  Calendar,
} from 'lucide-react';

const CLUB_CATEGORIES: Array<'TECHNOLOGY' | 'CULTURE' | 'SPORTS' | 'LITERARY' | 'ENTREPRENEURSHIP'> = [
  'TECHNOLOGY',
  'CULTURE',
  'SPORTS',
  'LITERARY',
  'ENTREPRENEURSHIP',
];

export const AdminClubsPage: React.FC = () => {
  const [clubs, setClubs] = useState<CampusClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<CampusClub | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'TECHNOLOGY' | 'CULTURE' | 'SPORTS' | 'LITERARY' | 'ENTREPRENEURSHIP'>('TECHNOLOGY');
  const [description, setDescription] = useState('');
  const [leadName, setLeadName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [meetingSchedule, setMeetingSchedule] = useState('');
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    const unsub = CampusService.subscribeClubs(
      (loaded) => {
        setClubs(loaded);
        setIsLoading(false);
        setLoadError(null);
      },
      (err) => {
        console.error('Failed to subscribe to clubs:', err);
        setLoadError('Failed to load campus clubs.');
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const openCreateModal = () => {
    setEditingClub(null);
    setName('');
    setCategory('TECHNOLOGY');
    setDescription('');
    setLeadName('');
    setContactEmail('');
    setMeetingSchedule('');
    setMemberCount(0);
    setIsModalOpen(true);
  };

  const openEditModal = (club: CampusClub) => {
    setEditingClub(club);
    setName(club.name);
    setCategory(club.category || 'TECHNOLOGY');
    setDescription(club.description || '');
    setLeadName(club.leadName || '');
    setContactEmail(club.contactEmail || '');
    setMeetingSchedule(club.meetingSchedule || '');
    setMemberCount(club.memberCount || 0);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert('Club name and description are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingClub) {
        await AdminService.manageClub('update', editingClub.id, {
          name: name.trim(),
          category,
          description: description.trim(),
          leadName: leadName.trim(),
          contactEmail: contactEmail.trim(),
          meetingSchedule: meetingSchedule.trim(),
          memberCount: Number(memberCount) || 0,
        });
      } else {
        await AdminService.manageClub('create', undefined, {
          name: name.trim(),
          category,
          description: description.trim(),
          leadName: leadName.trim(),
          contactEmail: contactEmail.trim(),
          meetingSchedule: meetingSchedule.trim(),
          memberCount: Number(memberCount) || 0,
          bannerGradient: 'from-blue-600 to-indigo-600',
          tags: [category.toLowerCase()],
          recentActivities: [],
          isArchived: false,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to manage club:', err);
      alert(err?.message || 'Failed to save campus club.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (club: CampusClub) => {
    if (!window.confirm(`Archive club "${club.name}"? It will be hidden from the active student directory.`)) return;

    try {
      await AdminService.manageClub('archive', club.id);
    } catch (err: any) {
      console.error('Failed to archive club:', err);
      alert(err?.message || 'Failed to archive club.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm">Campus Community</Badge>
            <span className="text-xs text-slate-400 font-semibold">Societies &amp; Chapters</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Campus Club Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Publish official student-led engineering, arts, robotics, and literary societies to the campus directory.
          </p>
        </div>

        <Button variant="gradient" size="sm" onClick={openCreateModal} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Club
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
          Loading verified campus clubs…
        </div>
      ) : clubs.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-10 h-10" />}
          title="No campus clubs onboarded"
          description="No official student clubs exist in Firestore yet. Register clubs to display them in the student portal."
          action={
            <Button size="sm" variant="gradient" onClick={openCreateModal}>
              Register Club
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <Card key={club.id} className="p-5 bg-slate-950 border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <Badge variant="amber" size="sm">
                    {club.category}
                  </Badge>
                  {club.isArchived && (
                    <Badge variant="slate" size="sm">
                      Archived
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{club.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{club.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-900 space-y-1.5 text-xs text-slate-300">
                  {club.leadName && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Lead: {club.leadName}</span>
                    </div>
                  )}
                  {club.meetingSchedule && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{club.meetingSchedule}</span>
                    </div>
                  )}
                  {club.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{club.contactEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-900 flex justify-between items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(club)}
                  className="text-xs text-slate-300 border-slate-800 hover:bg-slate-900"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleArchive(club)}
                  className="text-xs text-rose-400 hover:bg-rose-500/10 font-semibold"
                >
                  <Archive className="w-3 h-3 mr-1" />
                  Archive
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
          title={editingClub ? 'Edit Campus Club' : 'Register New Campus Club'}
          description="Provision or update a registered campus society in Cloud Firestore."
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Club Name</label>
              <Input
                placeholder="e.g. SolveSphere AI & Robotics Club"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-white"
                >
                  {CLUB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Active Members Count</label>
                <Input
                  type="number"
                  min={0}
                  value={memberCount}
                  onChange={(e) => setMemberCount(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Club mission, focus areas, activities..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Student Lead / President</label>
                <Input
                  placeholder="e.g. Aarav Patel"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Contact Email</label>
                <Input
                  type="email"
                  placeholder="e.g. robotics-lead@campus.edu"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Meeting Schedule</label>
              <Input
                placeholder="e.g. Every Wednesday at 4:30 PM in Tech Hub 201"
                value={meetingSchedule}
                onChange={(e) => setMeetingSchedule(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingClub ? 'Save Changes' : 'Register Club'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

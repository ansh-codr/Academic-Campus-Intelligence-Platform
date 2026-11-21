import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AcademicService } from '@/services/academicService';
import { SubjectSummary, StudyResource } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Search,
  FileText,
  Video,
  Download,
  CheckCircle,
  Eye,
  BookOpen,
  Filter,
  Sparkles,
  Info,
} from 'lucide-react';

export const StudyResourcesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subjectId') || 'ALL';

  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [selectedScope, setSelectedScope] = useState<string>('ALL');
  const [onlyFacultyApproved, setOnlyFacultyApproved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewResource, setPreviewResource] = useState<StudyResource | null>(null);

  useEffect(() => {
    async function load() {
      const [subjs, resList] = await Promise.all([
        AcademicService.getSubjects(),
        AcademicService.getResources({
          subjectId: selectedSubject,
          scope: selectedScope,
        }),
      ]);
      setSubjects(subjs);
      setResources(resList);
    }
    load();
  }, [selectedSubject, selectedScope]);

  const filteredResources = resources.filter((res) => {
    if (onlyFacultyApproved && !res.facultyApproved) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        res.title.toLowerCase().includes(q) ||
        res.description.toLowerCase().includes(q) ||
        res.authorFaculty?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="sm">Resource Repository</Badge>
          <span className="text-xs text-slate-500 font-semibold">Faculty Verified &amp; Curated Notes</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Syllabus-Aware Study Resources
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Discover verified lecture slides, practice sheets, and exploratory material categorized by course boundaries.
        </p>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2">
            <Input
              placeholder="Search notes, slides, problem sets, faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="ALL">All 6 Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scope Filter */}
          <div>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="ALL">All Scopes</option>
              <option value="WITHIN_SYLLABUS">Within Syllabus Only</option>
              <option value="OUTSIDE_SYLLABUS">Outside Syllabus (Deep Dives)</option>
            </select>
          </div>
        </div>

        {/* Faculty Checkbox */}
        <div className="flex items-center gap-2 pt-1 text-xs">
          <input
            type="checkbox"
            id="faculty-approved"
            checked={onlyFacultyApproved}
            onChange={(e) => setOnlyFacultyApproved(e.target.checked)}
            className="rounded text-brand-blue focus:ring-brand-blue"
          />
          <label htmlFor="faculty-approved" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            Show only faculty-approved official course resources
          </label>
        </div>
      </Card>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="No study resources found"
          description="Try broadening your subject filter, keyword search, or scope criteria."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSubject('ALL');
                setSelectedScope('ALL');
                setOnlyFacultyApproved(false);
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <Card key={resource.id} hoverEffect className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant={resource.scope === 'WITHIN_SYLLABUS' ? 'green' : 'cyan'}
                    size="sm"
                  >
                    {resource.scope === 'WITHIN_SYLLABUS' ? 'Within Syllabus' : 'Outside Syllabus'}
                  </Badge>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {resource.type}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {resource.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {resource.description}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {resource.facultyApproved && (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approved by {resource.authorFaculty}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">
                    Published: {resource.createdAt} &bull; {resource.downloadCount} cohort downloads
                  </div>
                </div>
              </div>

              {/* View / Download Simulation */}
              <div className="pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setPreviewResource(resource)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Inspect Document Preview
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Resource Inspection Modal with explicit Phase 1 disclaimer */}
      <Modal
        isOpen={!!previewResource}
        onClose={() => setPreviewResource(null)}
        title={previewResource?.title || 'Resource Details'}
        description={`Format: ${previewResource?.type} • Curated for first-year engineering syllabus`}
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-brand-blue dark:text-blue-300 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Phase 1 Full-Stack Notice:</strong> This resource preview displays verified curriculum metadata. Cloud document storage (S3/GCS bucket download endpoints) will be wired in Phase 2.
            </div>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-1">
              Curriculum Description
            </h5>
            <p>{previewResource?.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block font-semibold">FACULTY REVIEW</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                {previewResource?.authorFaculty || 'Academic Committee'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block font-semibold">SYLLABUS STATUS</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                {previewResource?.scope.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewResource(null)}>
              Close
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                alert(`[Demo Mode] Simulated download initiated for "${previewResource?.title}".`);
                setPreviewResource(null);
              }}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download Offline Copy (Demo)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

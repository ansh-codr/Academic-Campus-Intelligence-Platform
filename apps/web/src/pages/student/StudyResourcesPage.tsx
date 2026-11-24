import { externalFileUrl } from '@/lib/utils';
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
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const StudyResourcesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubject = searchParams.get('subjectId') || 'ALL';
  const initialTopic = searchParams.get('topicId') || '';

  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [selectedScope, setSelectedScope] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [onlyFacultyApproved, setOnlyFacultyApproved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewResource, setPreviewResource] = useState<StudyResource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [subjs, resList] = await Promise.all([
          AcademicService.getSubjects(),
          AcademicService.getResources({
            subjectId: selectedSubject,
            scope: selectedScope,
            topicId: initialTopic || undefined,
          }),
        ]);
        setSubjects(subjs);
        setResources(resList);
        setLoadError(null);
      } catch (err: any) {
        console.error('Failed to load study resources:', err);
        setLoadError(err?.message || 'Failed to load study resources.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [selectedSubject, selectedScope, initialTopic]);

  const filteredResources = resources.filter((res) => {
    if (selectedType !== 'ALL' && res.type !== selectedType) return false;
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

      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-200 text-xs sm:text-sm flex items-center justify-between"
        >
          <span>{loadError}</span>
        </div>
      )}

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

        {/* Type & Faculty Checkbox Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-500 uppercase">Type:</span>
            {['ALL', 'PDF', 'SLIDES', 'NOTE', 'PRACTICE_SHEET', 'VIDEO'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedType === type
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="faculty-approved"
              checked={onlyFacultyApproved}
              onChange={(e) => setOnlyFacultyApproved(e.target.checked)}
              className="rounded text-brand-blue focus:ring-brand-blue"
            />
            <label htmlFor="faculty-approved" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Show only faculty-approved official course resources
            </label>
          </div>
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
                setSelectedType('ALL');
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
          {filteredResources.map((res) => (
            <Card
              key={res.id}
              hoverEffect
              className="p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant={
                      res.scope === 'WITHIN_SYLLABUS' ? 'blue' : 'amber'
                    }
                    size="sm"
                  >
                    {res.scope === 'WITHIN_SYLLABUS'
                      ? 'Within Syllabus'
                      : 'Outside Syllabus'}
                  </Badge>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {res.type}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {res.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {res.description}
                </p>

                <div className="pt-2 text-xs space-y-1">
                  {res.facultyApproved && (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Verified: {res.authorFaculty || 'Faculty Coordinator'}</span>
                    </div>
                  )}
                  {res.downloadCount !== undefined && (
                    <span className="text-[11px] text-slate-400">
                      {res.downloadCount} student views
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setPreviewResource(res)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  Preview
                </Button>
                {res.fileUrl && (
                  <a
                    href={externalFileUrl(res.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1"
                  >
                    <Button variant="secondary" size="sm" className="w-full text-xs">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Open
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Resource Detail & Preview Modal */}
      {previewResource && (
        <Modal
          isOpen={!!previewResource}
          onClose={() => setPreviewResource(null)}
          title={previewResource.title}
          description={`${previewResource.type} Resource Preview`}
        >
          <div className="space-y-5 text-xs sm:text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={previewResource.scope === 'WITHIN_SYLLABUS' ? 'blue' : 'amber'} size="sm">
                {previewResource.scope.replace('_', ' ')}
              </Badge>
              <Badge variant={previewResource.facultyApproved ? 'green' : 'slate'} size="sm">
                {previewResource.facultyApproved ? 'Faculty Approved' : 'Community Curated'}
              </Badge>
              <Badge variant="blue" size="sm">
                {previewResource.type}
              </Badge>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white">Document Abstract &amp; Content Overview</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {previewResource.description}
              </p>
              {previewResource.authorFaculty && (
                <p className="text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                  Curated &amp; Reviewed by: <strong>{previewResource.authorFaculty}</strong>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewResource(null)}>
                Close
              </Button>
              {previewResource.fileUrl && (
                <a href={externalFileUrl(previewResource.fileUrl)} target="_blank" rel="noreferrer">
                  <Button variant="gradient" size="sm">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Open Full Resource
                  </Button>
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

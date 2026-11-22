import React, { useEffect, useState, useMemo } from 'react';
import { AdminService } from '@/services/adminService';
import { UserProfile } from '@solvesphere/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Users, Search, RefreshCw, GraduationCap, Building2, BookOpen } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const loadStudents = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await AdminService.getEnrolledStudents();
      setStudents(data);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      setErrorMsg(err.message || 'Failed to load students from Cloud Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.studentId?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [students, deptFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-brand-cyan flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Student Directory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse and monitor authentic registered university students in Cloud Firestore.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadStudents}
          isLoading={isLoading}
          className="border-slate-700 text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Refresh Directory</span>
        </Button>
      </div>

      {errorMsg && (
        <div role="alert" className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-[#111a2e] border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b1220] border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-[#0b1220] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Departments ({students.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Student List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Querying Firestore user profiles...</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card className="p-12 text-center bg-[#111a2e] border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No registered students found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'No students matched your search criteria.'
              : 'There are currently no student accounts registered in the database.'}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#111a2e]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0b1220] text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-4 py-3.5">Roll Number</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Semester</th>
                <th className="px-4 py-3.5">Enrollment Status</th>
                <th className="px-5 py-3.5">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 text-brand-cyan flex items-center justify-center font-bold text-xs">
                        {s.fullName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <span className="font-semibold text-white block">{s.fullName}</span>
                        <span className="text-[11px] text-slate-400">{s.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-amber-400">
                    {s.studentId || <span className="text-slate-500 italic">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    {s.department || <span className="text-slate-500 italic">Not set</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    {s.semester ? `Semester ${s.semester}` : <span className="text-slate-500 italic">N/A</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge
                      variant={
                        s.enrollmentStatus === 'VERIFIED'
                          ? 'green'
                          : s.enrollmentStatus === 'PENDING'
                          ? 'amber'
                          : s.enrollmentStatus === 'REJECTED'
                          ? 'rose'
                          : 'slate'
                      }
                    >
                      {s.enrollmentStatus || 'INCOMPLETE'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                    {s.createdAt ? formatDate(s.createdAt) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

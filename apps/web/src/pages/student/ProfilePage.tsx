import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuthDemo';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, GraduationCap, Building, ShieldCheck, Award, Save, CheckCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [department, setDepartment] = useState(user?.department || 'Computer Science & AI');
  const [semester, setSemester] = useState(user?.semester || 1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        department,
        semester: Number(semester),
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile in Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="blue" size="sm">Student Identity</Badge>
            <span className="text-xs text-slate-500 font-semibold">Cloud Firestore Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Student Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Authenticated profile information synchronized with Firebase.
          </p>
        </div>

        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit Academic Details
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            Cancel Editing
          </Button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Profile changes saved to Firestore!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Avatar Card */}
        <Card className="p-6 text-center space-y-4 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center text-white text-3xl font-extrabold shadow-glow-blue">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {user?.fullName || 'University Student'}
            </h3>
            <p className="text-xs font-mono text-slate-500">
              Student ID: {user?.studentId || 'CS26019'}
            </p>
          </div>
          <Badge variant="blue" size="md">
            Role: {user?.role || 'STUDENT'}
          </Badge>
          <p className="text-xs text-slate-400">
            Account Status: Active &bull; Firebase Verified
          </p>
        </Card>

        {/* Right Details Grid */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Academic Details
            </h4>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <Input
                  label="Department / Program"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
                <Input
                  label="Current Semester"
                  type="number"
                  min="1"
                  max="8"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  required
                />
                <Button type="submit" variant="gradient" size="sm" isLoading={isSaving}>
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Save to Firestore
                </Button>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-semibold">DEPARTMENT / BRANCH</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                    {user?.department || 'Computer Science & AI'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-semibold">CURRENT SEMESTER</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                    Semester {user?.semester || 1}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-semibold">CAMPUS RESIDENCE</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                    Hostel 3 &bull; Room 312
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-semibold">SECURITY ROLE</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                    {user?.role} (Non-Privileged)
                  </span>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Communication &amp; Contact
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Official University Email</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {user?.email || 'student@campus.edu'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Faculty Academic Advisor</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Dr. Aris Thorne (CS Dept)
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Authentication Provider</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Firebase Authentication
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

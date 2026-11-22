import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, GraduationCap, Building, ShieldCheck, Award, Save, CheckCircle, RefreshCw, Send } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, isEmailVerified, sendVerificationEmail, reloadUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [department, setDepartment] = useState(user?.department || '');
  const [semester, setSemester] = useState(user?.semester || 1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [verifySending, setVerifySending] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        department: department.trim() || undefined,
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

  const handleSendVerification = async () => {
    setVerifySending(true);
    setVerifyMessage(null);
    try {
      await sendVerificationEmail();
      setVerifyMessage('Verification email dispatched! Please check your inbox.');
    } catch (err: any) {
      setVerifyMessage(err.message || 'Could not send verification email.');
    } finally {
      setVerifySending(false);
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
        <div role="status" className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>Profile changes saved to Firestore!</span>
        </div>
      )}

      {verifyMessage && (
        <div role="status" className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2 font-semibold">
          <Mail className="w-4 h-4 text-brand-blue" />
          <span>{verifyMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Avatar Card */}
        <Card className="p-6 text-center space-y-4 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center text-white text-3xl font-extrabold shadow-glow-blue">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {user?.fullName || 'University Student'}
            </h3>
            {user?.studentId && (
              <p className="text-xs font-mono text-slate-500">
                Student ID: {user.studentId}
              </p>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <Badge variant="blue" size="md">
              Role: {user?.role || 'STUDENT'}
            </Badge>
            {isEmailVerified ? (
              <Badge variant="green" size="sm">
                Email Verified
              </Badge>
            ) : (
              <div className="flex flex-col items-center gap-1.5 mt-1">
                <Badge variant="amber" size="sm">
                  Verification Pending
                </Badge>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleSendVerification}
                    disabled={verifySending}
                    className="text-[11px] text-brand-blue hover:underline font-semibold flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    {verifySending ? 'Sending...' : 'Resend Link'}
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                  <button
                    onClick={reloadUser}
                    className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Account Status: Active &bull; Firebase Authenticated
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
                  placeholder="e.g. Computer Science & AI"
                />
                <Input
                  label="Current Semester"
                  type="number"
                  min="1"
                  max="12"
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
                    {user?.department || 'Not specified yet'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-semibold">CURRENT SEMESTER</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                    {user?.semester ? `Semester ${user.semester}` : 'Semester 1'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-semibold">ACCOUNT CREATED</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-semibold">SECURITY ROLE</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                    {user?.role} (Student)
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
                  {user?.email}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Verification Status</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {isEmailVerified ? 'Verified via Firebase Auth' : 'Pending Verification'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Authentication Provider</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Firebase Authentication (Email / Password)
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

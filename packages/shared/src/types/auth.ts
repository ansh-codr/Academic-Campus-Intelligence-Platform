export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export type EnrollmentStatus = 'INCOMPLETE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface EnrollmentRequest {
  id: string; // Document ID, matches student's userId
  userId: string;
  fullName: string;
  email: string;
  studentId: string; // Claimed institutional enrollment number / roll number
  department: string;
  semester: number;
  status: EnrollmentStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
  notes?: string;
}

export interface UniversityRosterRecord {
  id: string;
  studentId: string; // Authorized official institutional ID
  fullName: string;
  institutionalEmail?: string;
  department: string;
  semester?: number;
  batch?: string;
  active: boolean;
  registeredUserId?: string | null;
}

export interface UserProfile {
  id: string;
  fullName: string;
  studentId?: string;
  email: string;
  role: UserRole;
  emailVerified?: boolean;
  enrollmentStatus?: EnrollmentStatus;
  rejectionReason?: string | null;
  department?: string;
  semester?: number;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: UserProfile;
  token?: string;
  isDemoMode?: boolean;
}

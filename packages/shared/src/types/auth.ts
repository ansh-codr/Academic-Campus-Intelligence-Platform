export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface UserProfile {
  id: string;
  fullName: string;
  studentId?: string;
  email: string;
  role: UserRole;
  emailVerified?: boolean;
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

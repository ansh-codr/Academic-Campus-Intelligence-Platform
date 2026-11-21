export interface AdminMetrics {
  totalStudents: number;
  openComplaints: number;
  pendingApprovals: number;
  resolvedComplaints: number;
  resolutionRate: number;
  activeSubjects: number;
  criticalClusters: number;
}

export interface DepartmentWorkload {
  department: string;
  assignedCount: number;
  resolvedCount: number;
  averageResolutionDays: number;
}

export interface AdminActivityItem {
  id: string;
  type: 'COMPLAINT_CLUSTER' | 'TOPIC_UPDATE' | 'NEW_REGISTRATION' | 'RESOURCE_APPROVAL';
  title: string;
  description: string;
  timestamp: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

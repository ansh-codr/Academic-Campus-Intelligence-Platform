import { AdminMetrics, DepartmentWorkload, AdminActivityItem } from '@solvesphere/shared';

export const ADMIN_METRICS: AdminMetrics = {
  totalStudents: 1420,
  openComplaints: 28,
  pendingApprovals: 9,
  resolvedComplaints: 384,
  resolutionRate: 93.2,
  activeSubjects: 6,
  criticalClusters: 2,
};

export const DEPARTMENT_WORKLOAD: DepartmentWorkload[] = [
  {
    department: 'HVAC & Climate Control',
    assignedCount: 11,
    resolvedCount: 94,
    averageResolutionDays: 1.4,
  },
  {
    department: 'IT & Campus Network Operations',
    assignedCount: 8,
    resolvedCount: 142,
    averageResolutionDays: 0.8,
  },
  {
    department: 'Electrical Maintenance',
    assignedCount: 4,
    resolvedCount: 68,
    averageResolutionDays: 1.1,
  },
  {
    department: 'Public Health & Plumbing',
    assignedCount: 3,
    resolvedCount: 51,
    averageResolutionDays: 1.2,
  },
  {
    department: 'Campus Estate & Infrastructure',
    assignedCount: 2,
    resolvedCount: 29,
    averageResolutionDays: 2.1,
  },
];

export const RECENT_ADMIN_ACTIVITIES: AdminActivityItem[] = [
  {
    id: 'act-1',
    type: 'COMPLAINT_CLUSTER',
    title: 'New Cluster Detected: Block A AC Chillers',
    description: 'Semantic algorithm merged 4 incoming tickets from Engineering Block A with 94% similarity score.',
    timestamp: '15 minutes ago',
    severity: 'HIGH',
  },
  {
    id: 'act-2',
    type: 'TOPIC_UPDATE',
    title: 'CS101 Topic Marked Completed',
    description: 'Faculty Dr. Aris Thorne marked "Uninformed & Heuristic Search" completed.',
    timestamp: '2 hours ago',
    severity: 'LOW',
  },
  {
    id: 'act-3',
    type: 'RESOURCE_APPROVAL',
    title: 'Lab Guide Approved for Digital Electronics',
    description: 'Dr. Rajesh Nair verified and approved IC 7476 timing diagram worksheet.',
    timestamp: 'Yesterday at 4:10 PM',
    severity: 'LOW',
  },
  {
    id: 'act-4',
    type: 'NEW_REGISTRATION',
    title: '42 Freshmen Registrations Onboarded',
    description: 'Batch 2026 CS & EC student roster verified against Registrar records.',
    timestamp: 'Yesterday at 11:00 AM',
    severity: 'LOW',
  },
];

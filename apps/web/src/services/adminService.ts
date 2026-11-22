import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import {
  AdminMetrics,
  DepartmentWorkload,
  AdminActivityItem,
  IssueCluster,
  TicketStatus,
  CampusDepartment,
  CampusClub,
  UserProfile,
  UniversityRosterRecord,
} from '@solvesphere/shared';
import { CampusService } from './campusService';

export interface AdminOverviewData {
  metrics: AdminMetrics;
  departmentWorkload: DepartmentWorkload[];
  recentActivities: AdminActivityItem[];
  activeClusters: IssueCluster[];
}

/** All privileged mutations are trusted callable operations; no direct-write fallback. */
async function callAdminFunction<T>(name: string, data: unknown): Promise<T> {
  const fn = httpsCallable<unknown, T>(functions, name);
  return (await fn(data)).data;
}

export const AdminService = {
  async getOverview(): Promise<AdminOverviewData> {
    const [tickets, depts, clusters, usersCount, subjectsSnap] = await Promise.all([
      CampusService.getTickets(),
      CampusService.getDepartments(),
      CampusService.getClusters(),
      getCountFromServer(query(collection(db, 'users'), where('role', '==', 'STUDENT'))),
      getDocs(collection(db, 'subjects')),
    ]);
    const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    const activeClusters = clusters.filter(c => c.status === 'ACTIVE_INCIDENT' || c.status === 'SUGGESTED_INCIDENT');
    const workload: DepartmentWorkload[] = depts.map(dept => {
      const assigned = tickets.filter(t => t.assignedDepartment === dept.name);
      const resolved = assigned.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
      return {
        department: dept.name,
        assignedCount: assigned.length - resolved.length,
        resolvedCount: resolved.length,
        averageResolutionDays: 0,
      };
    });
    const recentActivities: AdminActivityItem[] = tickets
      .slice()
      .sort((a,b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        type: 'COMPLAINT_CLUSTER' as const,
        title: `Ticket ${t.referenceNumber} — ${t.status}`,
        description: t.title,
        timestamp: t.updatedAt,
        severity: t.priority === 'HIGH' || t.priority === 'URGENT' ? 'HIGH' as const : 'LOW' as const,
      }));
    return {
      metrics: {
        totalStudents: usersCount.data().count,
        openComplaints: tickets.length - resolvedTickets.length,
        pendingApprovals: tickets.filter(t => t.status === 'UNDER_REVIEW').length,
        resolvedComplaints: resolvedTickets.length,
        resolutionRate: tickets.length ? Math.round(resolvedTickets.length / tickets.length * 1000) / 10 : 0,
        activeSubjects: subjectsSnap.docs.filter(d => !d.data().isArchived).length,
        criticalClusters: activeClusters.length,
      },
      departmentWorkload: workload,
      recentActivities,
      activeClusters,
    };
  },

  /** Retrieve all student profiles from Firestore */
  async getEnrolledStudents(): Promise<UserProfile[]> {
    const q = query(collection(db, 'users'), where('role', '==', 'STUDENT'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UserProfile, 'id'>) }));
  },

  /** Retrieve official university roster records if provisioned */
  async getRosterRecords(): Promise<UniversityRosterRecord[]> {
    const snap = await getDocs(collection(db, 'universityRoster'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UniversityRosterRecord, 'id'>) }));
  },

  async updateTicketStatus(ticketId: string, newStatus: TicketStatus, note?: string): Promise<void> {
    await callAdminFunction('updateTicketStatus', { ticketId, newStatus, note });
  },

  async assignTicketDepartment(ticketId: string, departmentName: string, departmentId?: string, note?: string): Promise<void> {
    await callAdminFunction('assignTicketDepartment', { ticketId, departmentName, departmentId, note });
  },

  async manageDepartment(action: 'create' | 'update' | 'toggleActive', departmentId?: string, data?: Partial<CampusDepartment>): Promise<any> {
    return callAdminFunction('adminManageDepartment', { action, departmentId, data });
  },

  async manageClub(action: 'create' | 'update' | 'archive', clubId?: string, data?: Partial<CampusClub>): Promise<any> {
    return callAdminFunction('adminManageClub', { action, clubId, data });
  },

  async reviewCluster(clusterId: string, action: 'verify' | 'merge' | 'resolve' | 'dismiss' | 'reject', note?: string): Promise<any> {
    return callAdminFunction('adminReviewCluster', { clusterId, action, note });
  },

  async getWorkload(): Promise<DepartmentWorkload[]> {
    return (await this.getOverview()).departmentWorkload;
  },

  async getClusters(): Promise<IssueCluster[]> {
    return CampusService.getClusters();
  },
};

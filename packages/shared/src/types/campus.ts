export type TicketCategory =
  | 'AC_HVAC'
  | 'WIFI_NETWORK'
  | 'ELECTRICAL'
  | 'HOSTEL'
  | 'WATER_SUPPLY'
  | 'GENERAL_INFRASTRUCTURE'
  | 'SANITATION';

export type TicketStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TicketEvent {
  id: string;
  ticketId: string;
  status: TicketStatus;
  note: string;
  updatedBy: string;
  timestamp: string;
}

export interface CampusDepartment {
  id: string;
  name: string;
  code: string;
  category: TicketCategory;
  contactEmail: string;
  headName: string;
  activeTicketsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'STATUS_CHANGED'
  | 'RESOLVED'
  | 'REOPENED';

export interface CampusNotification {
  id: string;
  userId: string;
  ticketId: string;
  referenceNumber: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface CampusTicket {
  id: string;
  referenceNumber: string;
  title: string;
  category: TicketCategory;
  building: string;
  floor: string;
  room: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedDepartment: string;
  assignedDepartmentId?: string;
  attachmentUrls?: string[];
  submittedById?: string;
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
  clusterId?: string;
  timeline: TicketEvent[];
}

export interface IssueCluster {
  id: string;
  title: string;
  category: TicketCategory;
  affectedArea: string;
  building?: string;
  room?: string;
  ticketCount: number;
  ticketIds: string[];
  clusteringMethod?: 'RULE_BASED_LOCATION_PROXIMITY';
  verifiedByAdmin?: boolean;
  status: 'SUGGESTED_INCIDENT' | 'ACTIVE_INCIDENT' | 'RESOLVING' | 'MERGED' | 'DISMISSED';
  suggestedAction: string;
  createdAt: string;
  updatedAt?: string;
  confidenceScore?: number;
}

export interface CampusClub {
  id: string;
  name: string;
  category: 'TECHNOLOGY' | 'CULTURE' | 'SPORTS' | 'LITERARY' | 'ENTREPRENEURSHIP';
  leadName: string;
  description: string;
  memberCount: number;
  meetingSchedule: string;
  bannerGradient: string;
  tags: string[];
  recentActivities: string[];
  isArchived?: boolean;
  contactEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnonymousReport {
  id: string;
  trackingCode: string;
  category: string;
  description: string;
  submittedAt: string;
  status: 'RECEIVED' | 'UNDER_SENSITIVE_REVIEW' | 'ACTION_TAKEN';
  privacyLevel: 'ANONYMOUS_UNVERIFIED_DEMO';
}

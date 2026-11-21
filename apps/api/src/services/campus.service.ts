import { CampusTicket, IssueCluster, CampusClub, AnonymousReport, CreateTicketInput } from '@solvesphere/shared';

export const INITIAL_TICKETS: CampusTicket[] = [
  {
    id: 'tkt-001',
    referenceNumber: 'CMP-2026-0841',
    title: 'Lecture Hall 204 AC Unit Leaking Water & Not Cooling',
    category: 'AC_HVAC',
    building: 'Engineering Block A',
    floor: '2nd Floor',
    room: 'Hall 204',
    description: 'The ceiling split AC in Hall 204 has stopped cooling and is dripping water onto the front row desks during morning lectures.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedDepartment: 'HVAC & Climate Control',
    submittedBy: 'Kavya Sharma (CS2601)',
    submittedAt: '2026-11-19T09:15:00Z',
    updatedAt: '2026-11-20T14:30:00Z',
    clusterId: 'cluster-hvac-block-a',
    timeline: [
      {
        id: 'ev-1',
        ticketId: 'tkt-001',
        status: 'SUBMITTED',
        note: 'Issue reported by student via SolveSphere portal.',
        updatedBy: 'System Auto-Ingest',
        timestamp: '2026-11-19T09:15:00Z',
      },
      {
        id: 'ev-2',
        ticketId: 'tkt-001',
        status: 'UNDER_REVIEW',
        note: 'Triage team flagged high priority due to lecture hall disruption.',
        updatedBy: 'Admin Dispatcher',
        timestamp: '2026-11-19T10:00:00Z',
      },
      {
        id: 'ev-3',
        ticketId: 'tkt-001',
        status: 'ASSIGNED',
        note: 'Assigned to Senior HVAC Technician R. Gupta.',
        updatedBy: 'Estate Office',
        timestamp: '2026-11-19T11:20:00Z',
      },
      {
        id: 'ev-4',
        ticketId: 'tkt-001',
        status: 'IN_PROGRESS',
        note: 'Technician on-site. Drain line cleared; compressor relay replacement underway.',
        updatedBy: 'R. Gupta (HVAC)',
        timestamp: '2026-11-20T14:30:00Z',
      },
    ],
  },
  {
    id: 'tkt-002',
    referenceNumber: 'CMP-2026-0842',
    title: 'Block A 2nd Floor Corridor AC Blowing Warm Air',
    category: 'AC_HVAC',
    building: 'Engineering Block A',
    floor: '2nd Floor',
    room: 'Corridor East',
    description: 'Central cooling unit along corridor near labs is blowing warm air.',
    priority: 'MEDIUM',
    status: 'ASSIGNED',
    assignedDepartment: 'HVAC & Climate Control',
    submittedBy: 'Aman Verma (CS2612)',
    submittedAt: '2026-11-19T11:45:00Z',
    updatedAt: '2026-11-19T12:00:00Z',
    clusterId: 'cluster-hvac-block-a',
    timeline: [
      {
        id: 'ev-201',
        ticketId: 'tkt-002',
        status: 'SUBMITTED',
        note: 'Reported via portal.',
        updatedBy: 'System',
        timestamp: '2026-11-19T11:45:00Z',
      },
      {
        id: 'ev-202',
        ticketId: 'tkt-002',
        status: 'ASSIGNED',
        note: 'AI Cluster Assistant grouped with CMP-2026-0841.',
        updatedBy: 'SolveSphere Clustering Bot',
        timestamp: '2026-11-19T12:00:00Z',
      },
    ],
  },
  {
    id: 'tkt-003',
    referenceNumber: 'CMP-2026-0799',
    title: 'Wi-Fi Access Point Dropping Packets in Central Library 1st Floor',
    category: 'WIFI_NETWORK',
    building: 'Central Library',
    floor: '1st Floor',
    room: 'Silent Study Zone',
    description: 'Eduroam and Campus-Secure networks continuously disconnect every 5 minutes when more than 30 students are connected.',
    priority: 'HIGH',
    status: 'UNDER_REVIEW',
    assignedDepartment: 'IT & Campus Network Operations',
    submittedBy: 'Rohan Mehta (EC2605)',
    submittedAt: '2026-11-20T16:00:00Z',
    updatedAt: '2026-11-20T16:15:00Z',
    timeline: [
      {
        id: 'ev-301',
        ticketId: 'tkt-003',
        status: 'SUBMITTED',
        note: 'Ticket submitted.',
        updatedBy: 'System',
        timestamp: '2026-11-20T16:00:00Z',
      },
      {
        id: 'ev-302',
        ticketId: 'tkt-003',
        status: 'UNDER_REVIEW',
        note: 'Network operations investigating AP load and DHCP pool exhaustion.',
        updatedBy: 'IT Helpdesk',
        timestamp: '2026-11-20T16:15:00Z',
      },
    ],
  },
  {
    id: 'tkt-004',
    referenceNumber: 'CMP-2026-0710',
    title: 'Water Cooler Filter Replacement on Hostel 3 Ground Floor',
    category: 'WATER_SUPPLY',
    building: 'Hostel 3 (Boys)',
    floor: 'Ground Floor',
    room: 'Near Dining Hall Entrance',
    description: 'Red indicator light is blinking on the RO water purifier indicating filter expiry.',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    assignedDepartment: 'Public Health & Plumbing',
    submittedBy: 'Devansh K. (ME2609)',
    submittedAt: '2026-11-16T10:00:00Z',
    updatedAt: '2026-11-18T17:00:00Z',
    timeline: [
      {
        id: 'ev-401',
        ticketId: 'tkt-004',
        status: 'SUBMITTED',
        note: 'Submitted.',
        updatedBy: 'System',
        timestamp: '2026-11-16T10:00:00Z',
      },
      {
        id: 'ev-402',
        ticketId: 'tkt-004',
        status: 'IN_PROGRESS',
        note: 'Replacement cartridge dispatched.',
        updatedBy: 'Plumbing Staff',
        timestamp: '2026-11-17T11:00:00Z',
      },
      {
        id: 'ev-403',
        ticketId: 'tkt-004',
        status: 'RESOLVED',
        note: 'Filters replaced, TDS verified at 85 ppm, signed off by Hostel Warden.',
        updatedBy: 'Hostel Supervisor',
        timestamp: '2026-11-18T17:00:00Z',
      },
    ],
  },
];

export const ISSUE_CLUSTERS: IssueCluster[] = [
  {
    id: 'cluster-hvac-block-a',
    title: 'Engineering Block A: 2nd Floor Chiller Compressor Malfunction',
    category: 'AC_HVAC',
    affectedArea: 'Block A, 2nd Floor (Halls 204, 205 & East Wing)',
    ticketCount: 4,
    ticketIds: ['CMP-2026-0841', 'CMP-2026-0842', 'CMP-2026-0845', 'CMP-2026-0848'],
    confidenceScore: 0.94,
    status: 'ACTIVE_INCIDENT',
    suggestedAction: 'Single Root-Cause Work Order: Replace master coolant valve on Chiller-02 rather than separate room repairs.',
    createdAt: '2026-11-19T12:00:00Z',
  },
  {
    id: 'cluster-wifi-library',
    title: 'Central Library: 5GHz Channel Overcrowding during Exam Prep Week',
    category: 'WIFI_NETWORK',
    affectedArea: 'Library Floors 1 & 2',
    ticketCount: 6,
    ticketIds: ['CMP-2026-0799', 'CMP-2026-0803', 'CMP-2026-0810'],
    confidenceScore: 0.91,
    status: 'ACTIVE_INCIDENT',
    suggestedAction: 'Dynamic frequency balancing: Spin up temporary Cisco Catalyst mobile APs in reading bay.',
    createdAt: '2026-11-20T17:00:00Z',
  },
];

export const CAMPUS_CLUBS: CampusClub[] = [
  {
    id: 'club-ai',
    name: 'NeuralCraft AI Club',
    category: 'TECHNOLOGY',
    leadName: 'Tanvi Saxena',
    description: 'Hands-on AI projects, Kaggle teams, LLM model building, and weekly paper reading sessions.',
    memberCount: 240,
    meetingSchedule: 'Every Wednesday at 5:30 PM (CS Seminar Hall)',
    bannerGradient: 'from-blue-600 to-cyan-500',
    tags: ['Machine Learning', 'Computer Vision', 'PyTorch', 'Hackathons'],
    recentActivities: [
      'Hosted 24-hr Intra-Campus AI Hackathon with 40 teams',
      'Workshop: Building RAG bots with open weights',
    ],
  },
  {
    id: 'club-robotics',
    name: 'RoboKnights Robotics & Hardware',
    category: 'TECHNOLOGY',
    leadName: 'Karthik Rao',
    description: 'Hardware prototyping, autonomous rovers, PCB fabrication, and competitive robotics battles.',
    memberCount: 175,
    meetingSchedule: 'Tuesdays & Thursdays at 6:00 PM (Mechatronics Bay)',
    bannerGradient: 'from-emerald-600 to-teal-500',
    tags: ['Microcontrollers', 'ROS2', 'Soldering', 'CAD'],
    recentActivities: [
      'Deployed autonomous library book-sorting chassis test',
      'PCB soldering boot camp for first-year students',
    ],
  },
  {
    id: 'club-design',
    name: 'Pixel & Vector Design Collective',
    category: 'CULTURE',
    leadName: 'Sneha Roy',
    description: 'UI/UX design sprints, design thinking workshops, product branding, and visual typography.',
    memberCount: 130,
    meetingSchedule: 'Fridays at 4:30 PM (Design Lab B)',
    bannerGradient: 'from-purple-600 to-pink-500',
    tags: ['UI/UX', 'Figma', 'Product Design', 'Branding'],
    recentActivities: [
      'Campus Redesign Sprint: Student Portal Heuristic Evaluation',
      'Guest session by Senior Product Designer at Tech Giant',
    ],
  },
  {
    id: 'club-speech',
    name: 'Orators Society & Debate Union',
    category: 'LITERARY',
    leadName: 'Zayd Siddiqui',
    description: 'Parliamentary debates, Model UN, Extempore speaking coaching, and Group Discussion mastery.',
    memberCount: 160,
    meetingSchedule: 'Mondays at 5:00 PM (Auditorium 2)',
    bannerGradient: 'from-amber-600 to-orange-500',
    tags: ['Debate', 'Extempore', 'Public Speaking', 'MUN'],
    recentActivities: [
      'Inter-departmental Freshers Extempore Championship',
      'GD Practice sessions for summer internship preparation',
    ],
  },
];

let ticketsStore: CampusTicket[] = [...INITIAL_TICKETS];
let anonymousReportsStore: AnonymousReport[] = [];

export const CampusService = {
  getTickets(): CampusTicket[] {
    return ticketsStore;
  },

  createTicket(input: CreateTicketInput, submittedBy: string = 'Demo Student (CS2601)'): CampusTicket {
    const nextNum = 850 + ticketsStore.length;
    const ref = `CMP-2026-0${nextNum}`;
    const newTicket: CampusTicket = {
      id: `tkt-${Date.now()}`,
      referenceNumber: ref,
      title: input.title,
      category: input.category,
      building: input.building,
      floor: input.floor,
      room: input.room,
      description: input.description,
      priority: input.priority || 'MEDIUM',
      status: 'SUBMITTED',
      assignedDepartment: getDepartmentForCategory(input.category),
      submittedBy,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `ev-${Date.now()}`,
          ticketId: `tkt-${Date.now()}`,
          status: 'SUBMITTED',
          note: 'Ticket created and queued for automated semantic clustering.',
          updatedBy: 'System Ingest',
          timestamp: new Date().toISOString(),
        },
      ],
    };
    ticketsStore.unshift(newTicket);
    return newTicket;
  },

  getClusters(): IssueCluster[] {
    return ISSUE_CLUSTERS;
  },

  getClubs(): CampusClub[] {
    return CAMPUS_CLUBS;
  },

  submitSpeakFreely(category: string, description: string): AnonymousReport {
    const report: AnonymousReport = {
      id: `anon-${Date.now()}`,
      trackingCode: `ANON-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      category,
      description,
      submittedAt: new Date().toISOString(),
      status: 'RECEIVED',
      privacyLevel: 'ANONYMOUS_UNVERIFIED_DEMO',
    };
    anonymousReportsStore.push(report);
    return report;
  },
};

function getDepartmentForCategory(cat: string): string {
  switch (cat) {
    case 'AC_HVAC':
      return 'HVAC & Climate Control';
    case 'WIFI_NETWORK':
      return 'IT & Campus Network Operations';
    case 'ELECTRICAL':
      return 'Electrical Maintenance';
    case 'WATER_SUPPLY':
      return 'Public Health & Plumbing';
    case 'HOSTEL':
      return 'Hostel Administration Office';
    case 'SANITATION':
      return 'Housekeeping & Sanitation';
    default:
      return 'Campus Estate & General Infrastructure';
  }
}

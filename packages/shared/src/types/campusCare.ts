import { TicketCategory, TicketPriority, TicketStatus } from './campus.js';

export interface AskCampusCareRequest {
  prompt: string;
  conversationId?: string;
  conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>;
}

export interface RelevantTicketSnippet {
  id: string;
  referenceNumber: string;
  title: string;
  status: TicketStatus;
  category: TicketCategory;
  assignedDepartment: string;
  submittedAt: string;
  updatedAt: string;
}

export interface ComplaintDraftSuggestion {
  title: string;
  category: TicketCategory;
  building: string;
  floor?: string;
  room: string;
  description: string;
  priority: TicketPriority;
  suggestedDepartment: string;
}

export interface AskCampusCareResponse {
  reply: string;
  conversationId: string;
  suggestedAction?: 'DRAFT_COMPLAINT' | 'CHECK_TICKETS' | 'CONTACT_DEPARTMENT' | 'GENERAL_ADVICE';
  draftComplaint?: ComplaintDraftSuggestion;
  relevantTickets?: RelevantTicketSnippet[];
  suggestedFaqs?: string[];
  isMock?: boolean;
}

export interface AiAssistComplaintRequest {
  rawInput: string;
  building?: string;
  floor?: string;
  room?: string;
}

export interface AiAssistComplaintResponse {
  suggestedTitle: string;
  suggestedCategory: TicketCategory;
  enhancedDescription: string;
  suggestedDepartment: string;
  suggestedPriority: TicketPriority;
  missingInfo?: string[];
  isMock?: boolean;
  provider?: string;
  enhancementSource?: string;
}

export interface CampusCareConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampusCareMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  metadata?: {
    suggestedAction?: string;
    isMock?: boolean;
    draftComplaint?: ComplaintDraftSuggestion;
    ticketReferences?: string[];
  };
}

export interface ComplaintEmbeddingRecord {
  complaintId: string;
  embedding: number[];
  source: 'GEMINI' | 'TEST';
  model: string;
  dimensions: number;
  textHash: string;
  textSnippet: string;
  createdAt: string;
  status: 'SUCCESS' | 'FAILED';
}

import { z } from 'zod';
import { TicketCategoryEnum, TicketPriorityEnum } from './ticket.schema.js';

export const AskCampusCareSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, 'Prompt cannot be empty.')
    .max(1500, 'Prompt exceeds 1500 characters.'),
  conversationId: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid conversation identifier format.')
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string().max(2000, 'Message text exceeds 2000 characters.'),
      })
    )
    .max(30, 'Conversation history cannot exceed 30 messages.')
    .optional(),
});

export type AskCampusCareInput = z.infer<typeof AskCampusCareSchema>;

export const AiAssistComplaintSchema = z.object({
  rawInput: z
    .string()
    .trim()
    .min(3, 'Issue description must be at least 3 characters.')
    .max(1500, 'Description exceeds 1500 characters.'),
  building: z.string().trim().max(100).optional(),
  floor: z.string().trim().max(50).optional(),
  room: z.string().trim().max(100).optional(),
});

export type AiAssistComplaintInput = z.infer<typeof AiAssistComplaintSchema>;

export const AdminReviewClusterSchema = z.object({
  clusterId: z
    .string()
    .trim()
    .min(1, 'clusterId is required.')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid cluster ID format.'),
  action: z.enum(['verify', 'merge', 'resolve', 'dismiss', 'reject']),
  note: z.string().trim().max(500, 'Review note cannot exceed 500 characters.').optional(),
});

export type AdminReviewClusterInput = z.infer<typeof AdminReviewClusterSchema>;

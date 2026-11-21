import { z } from 'zod';

export const TicketCategoryEnum = z.enum([
  'AC_HVAC',
  'WIFI_NETWORK',
  'ELECTRICAL',
  'HOSTEL',
  'WATER_SUPPLY',
  'GENERAL_INFRASTRUCTURE',
  'SANITATION',
]);

export const TicketPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const CreateTicketSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  category: TicketCategoryEnum,
  building: z.string().min(2, 'Building is required'),
  floor: z.string().min(1, 'Floor is required'),
  room: z.string().min(1, 'Room or specific location is required'),
  description: z
    .string()
    .min(15, 'Please provide more details (at least 15 characters)')
    .max(1000, 'Description cannot exceed 1000 characters'),
  priority: TicketPriorityEnum.default('MEDIUM'),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const SpeakFreelySchema = z.object({
  category: z.string().min(2, 'Category is required'),
  description: z
    .string()
    .min(20, 'Please describe your concern with at least 20 characters')
    .max(1500, 'Description cannot exceed 1500 characters'),
  acknowledgeNotice: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge the Phase 1 privacy advisory',
  }),
});

export type SpeakFreelyInput = z.infer<typeof SpeakFreelySchema>;

import { z } from 'zod';

export const quizQuestionSchema = z
  .object({
    id: z.string().min(1).max(128).regex(/^[^/]+$/).optional(),
    questionText: z.string().trim().min(3, 'Question text must be at least 3 characters'),
    options: z.array(z.string().trim().min(1, 'Option cannot be empty')).min(2, 'Must have at least 2 options'),
    correctOptionIndex: z.number().int().min(0, 'correctOptionIndex must be non-negative'),
    explanation: z.string().trim().min(3, 'Explanation must be at least 3 characters'),
    order: z.number().int().optional(),
  })
  .refine((data) => data.correctOptionIndex < data.options.length, {
    message: 'correctOptionIndex must be strictly within the range of available options',
    path: ['correctOptionIndex'],
  });

export const quizMetadataSchema = z.object({
  id: z.string().min(1).max(128).regex(/^[^/]+$/).optional(),
  topicId: z.string().max(128).optional(),
  subjectId: z.string().trim().max(128).min(1, 'Subject ID is required'),
  title: z.string().trim().min(3, 'Quiz title must be at least 3 characters'),
  description: z.string().trim().default(''),
  durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute').default(15),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('INTERMEDIATE'),
  type: z.enum(['QUIZ', 'EXAM_PREP', 'GROUP_DISCUSSION', 'EXTEMPORE']).default('QUIZ'),
  published: z.boolean().default(false),
});

export const publishedQuizSubmissionSchema = z.object({
  quiz: quizMetadataSchema,
  questions: z.array(quizQuestionSchema).max(200).min(1, 'Published assessment must contain at least 1 valid question'),
});

export const draftQuizSubmissionSchema = z.object({
  quiz: quizMetadataSchema,
  questions: z
    .array(
      z.object({
        id: z.string().min(1).max(128).regex(/^[^/]+$/).optional(),
        questionText: z.string().trim().default(''),
        options: z.array(z.string().trim()).default([]),
        correctOptionIndex: z.number().int().default(0),
        explanation: z.string().trim().default(''),
        order: z.number().int().optional(),
      })
    )
    .max(200).default([]),
});

export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
export type QuizMetadataInput = z.infer<typeof quizMetadataSchema>;
export type PublishedQuizInput = z.infer<typeof publishedQuizSubmissionSchema>;
export type DraftQuizInput = z.infer<typeof draftQuizSubmissionSchema>;

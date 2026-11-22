import { z } from 'zod';

export const StudentRegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full Name must be at least 2 characters')
      .max(100, 'Full Name cannot exceed 100 characters'),
    email: z
      .string()
      .min(5, 'Email is required')
      .email('Please enter a valid university email address'),
    studentId: z
      .string()
      .min(4, 'Student ID / Login ID must be at least 4 characters')
      .max(30, 'Student ID cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Student ID can only contain letters, numbers, hyphens, and underscores'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type StudentRegisterInput = z.infer<typeof StudentRegisterSchema>;

export const StudentLoginSchema = z.object({
  email: z.string().email('Please enter a valid university email address'),
  password: z.string().min(1, 'Password is required'),
});

export type StudentLoginInput = z.infer<typeof StudentLoginSchema>;

export const AdminLoginSchema = z.object({
  email: z.string().email('Please enter a valid admin email address'),
  password: z.string().min(1, 'Password is required'),
});

export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

export const EnrollmentSubmissionSchema = z.object({
  fullName: z.string().min(2, 'Full Name must be at least 2 characters').max(100),
  studentId: z
    .string()
    .min(4, 'Institutional Enrollment Number must be at least 4 characters')
    .max(30, 'Institutional Enrollment Number cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Enrollment Number can only contain letters, numbers, hyphens, and underscores'),
  department: z.string().min(2, 'Department is required').max(100, 'Department cannot exceed 100 characters'),
  semester: z.number().int().min(1, 'Semester must be between 1 and 12').max(12, 'Semester must be between 1 and 12'),
});

export type EnrollmentSubmissionInput = z.infer<typeof EnrollmentSubmissionSchema>;

export const EnrollmentReviewSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().max(500, 'Rejection reason cannot exceed 500 characters').optional(),
});

export type EnrollmentReviewInput = z.infer<typeof EnrollmentReviewSchema>;

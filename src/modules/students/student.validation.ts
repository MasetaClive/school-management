import { z } from 'zod';

export const createStudentSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  full_name: z.string().min(1, 'Full name is required'),
  date_of_birth: z.string().optional(), // ISO date string
  gender: z.string().optional(),
  class_id: z.string().uuid().or(z.literal('')).optional(),
  parent_id: z.string().uuid().or(z.literal('')).optional(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
  guardian_email: z.string().email().or(z.literal('')).optional(),
  medical_info: z
    .union([z.string(), z.record(z.string(), z.unknown())])
    .optional(),
  admission_date: z.string().optional(), // ISO date string
  academic_year: z.string().min(1, 'Academic year is required'),
  create_account: z.boolean().optional(),
  password_mode: z.enum(['auto', 'manual']).default('auto'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
}).superRefine((data, ctx) => {
  if (data.create_account && data.password_mode === 'manual' && !data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['password'],
      message: 'Password is required when manual password mode is selected',
    });
  }
});

export const updateStudentSchema = z.object({
  full_name: z.string().min(1).optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  class_id: z.string().uuid().optional(),
  parent_id: z.string().uuid().optional(),
  guardian_name: z.string().optional(),
  guardian_phone: z.string().optional(),
  guardian_email: z.string().email().or(z.literal('')).optional(),
  medical_info: z
    .union([z.string(), z.record(z.string(), z.unknown())])
    .optional(),
  admission_date: z.string().optional(),
  academic_year: z.string().min(1, 'Academic year is required').optional(),
});

export const listStudentsQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => {
      const n = Number(v);
      return Number.isNaN(n) || n < 1 ? 1 : n;
    })
    .optional(),
  search: z.string().optional(),
  class_id: z.string().uuid().optional(),
  academic_year: z.string().optional(),
});

export const studentIdParamSchema = z.string().uuid('Invalid student ID');

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;

import { z } from 'zod';

export const createTeacherSchema = z.object({
    teacher_id: z.string().min(1, 'Teacher ID is required'),
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
    phone: z.string().optional().nullable(),
    hire_date: z.string().optional().nullable(),
    qualification: z.string().optional().nullable(),
    create_account: z.boolean().optional(),
    password_mode: z.enum(['auto', 'manual']).default('auto'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
}).superRefine((data, ctx) => {
    if (data.create_account && data.password_mode === 'manual' && !data.password) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Password is required when manual password mode is selected' });
    }
});

export const updateTeacherSchema = z
    .object({
        full_name: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        hire_date: z.string().optional().nullable(),
        qualification: z.string().optional().nullable(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

export const listTeachersQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
    search: z.string().optional(),
});

export const teacherIdParamSchema = z.string().uuid('Invalid teacher ID');

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type ListTeachersQuery = z.infer<typeof listTeachersQuerySchema>;

import { z } from 'zod';

export const teacherAttendanceStatusSchema = z.enum(['present', 'absent', 'late']);

export const createTeacherAttendanceSchema = z.object({
    teacher_id: z.string().uuid('Invalid teacher ID'),
    attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    status: teacherAttendanceStatusSchema,
    remarks: z.string().optional().nullable(),
});

export const updateTeacherAttendanceSchema = z
    .object({
        status: teacherAttendanceStatusSchema.optional(),
        remarks: z.string().optional().nullable(),
        attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

export const listTeacherAttendanceQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
    teacher_id: z.string().uuid().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateTeacherAttendanceInput = z.infer<typeof createTeacherAttendanceSchema>;
export type UpdateTeacherAttendanceInput = z.infer<typeof updateTeacherAttendanceSchema>;
export type ListTeacherAttendanceQuery = z.infer<typeof listTeacherAttendanceQuerySchema>;

import { z } from 'zod';

export const studentAttendanceStatusSchema = z.enum(['present', 'absent', 'late']);

export const createStudentAttendanceSchema = z.object({
    student_id: z.string().uuid('Invalid student ID'),
    class_id: z.string().uuid('Invalid class ID'),
    attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    status: studentAttendanceStatusSchema,
    remarks: z.string().optional().nullable(),
    recorded_by: z.string().uuid('Invalid teacher ID').optional().nullable(),
});

export const updateStudentAttendanceSchema = z
    .object({
        status: studentAttendanceStatusSchema.optional(),
        remarks: z.string().optional().nullable(),
        recorded_by: z.string().uuid().optional().nullable(),
        attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

export const listStudentAttendanceQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
    student_id: z.string().uuid().optional(),
    class_id: z.string().uuid().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateStudentAttendanceInput = z.infer<typeof createStudentAttendanceSchema>;
export type UpdateStudentAttendanceInput = z.infer<typeof updateStudentAttendanceSchema>;
export type ListStudentAttendanceQuery = z.infer<typeof listStudentAttendanceQuerySchema>;

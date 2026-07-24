import { z } from 'zod';

export const studentAttendanceStatusSchema = z.enum(['present', 'absent', 'late']);
const attendanceDateSchema = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine((value) => {
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    }, 'Invalid calendar date');

export const createStudentAttendanceSchema = z.object({
    student_id: z.string().uuid('Invalid student ID'),
    class_id: z.string().uuid('Invalid class ID'),
    attendance_date: attendanceDateSchema,
    status: studentAttendanceStatusSchema,
    remarks: z.string().trim().max(2000).optional().nullable(),
    recorded_by: z.string().uuid('Invalid teacher ID').optional().nullable(),
});

export const updateStudentAttendanceSchema = z
    .object({
        student_id: z.string().uuid().optional(),
        class_id: z.string().uuid().optional(),
        status: studentAttendanceStatusSchema.optional(),
        remarks: z.string().trim().max(2000).optional().nullable(),
        recorded_by: z.string().uuid().optional().nullable(),
        attendance_date: attendanceDateSchema.optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

export const studentAttendanceIdParamSchema = z.string().uuid('Invalid attendance record ID');

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
    date: attendanceDateSchema.optional(),
    status: studentAttendanceStatusSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export type CreateStudentAttendanceInput = z.infer<typeof createStudentAttendanceSchema>;
export type UpdateStudentAttendanceInput = z.infer<typeof updateStudentAttendanceSchema>;
export type ListStudentAttendanceQuery = z.infer<typeof listStudentAttendanceQuerySchema>;

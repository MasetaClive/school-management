import { z } from 'zod';

export const examTypeSchema = z.enum(['assessment', 'quiz', 'test', 'midterm', 'final', 'practical']);
const examDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, 'Invalid calendar date');

export const createExamSchema = z.object({
    name: z.string().trim().min(1, 'Exam name is required').max(255),
    class_id: z.string().uuid('Invalid class ID'),
    subject_id: z.string().uuid('Invalid subject ID'),
    teacher_id: z.string().uuid('Invalid teacher ID'),
    exam_type: examTypeSchema,
    exam_date: examDateSchema,
    max_marks: z.number().positive('Max marks must be greater than 0').max(1000).multipleOf(0.01),
    academic_year: z.string().trim().min(1, 'Academic year is required'),
});

export const updateExamSchema = z
    .object({
        name: z.string().trim().min(1).max(255).optional(),
        class_id: z.string().uuid().optional(),
        subject_id: z.string().uuid().optional(),
        teacher_id: z.string().uuid().optional(),
        exam_type: examTypeSchema.optional(),
        exam_date: examDateSchema.optional(),
        max_marks: z.number().positive().max(1000).multipleOf(0.01).optional(),
        academic_year: z.string().trim().min(1).optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

export const examIdParamSchema = z.string().uuid('Invalid exam ID');

export const listExamsQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
    class_id: z.string().uuid().optional(),
    subject_id: z.string().uuid().optional(),
    teacher_id: z.string().uuid().optional(),
    academic_year: z.string().trim().min(1).optional(),
    exam_type: examTypeSchema.optional(),
    exam_date: examDateSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type ListExamsQuery = z.infer<typeof listExamsQuerySchema>;

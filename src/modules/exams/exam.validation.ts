import { z } from 'zod';

export const createExamSchema = z.object({
    name: z.string().min(1, 'Exam name is required'),
    class_id: z.string().uuid('Invalid class ID'),
    subject_id: z.string().uuid('Invalid subject ID'),
    exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    max_marks: z.number().positive('Max marks must be greater than 0'),
    academic_year: z.string().min(1, 'Academic year is required'),
});

export const updateExamSchema = z
    .object({
        name: z.string().min(1).optional(),
        class_id: z.string().uuid().optional(),
        subject_id: z.string().uuid().optional(),
        exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        max_marks: z.number().positive().optional(),
        academic_year: z.string().min(1).optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

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
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type ListExamsQuery = z.infer<typeof listExamsQuerySchema>;

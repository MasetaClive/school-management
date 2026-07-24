import { z } from 'zod';

export const createResultSchema = z.object({
    exam_id: z.string().uuid('Invalid exam ID'),
    student_id: z.string().uuid('Invalid student ID'),
    marks_obtained: z.number().min(0, 'Marks obtained must be at least 0').max(1000).multipleOf(0.01),
    remarks: z.string().trim().max(2000).optional().nullable(),
});

export const updateResultSchema = z
    .object({
        marks_obtained: z.number().min(0).max(1000).multipleOf(0.01).optional(),
        remarks: z.string().trim().max(2000).optional().nullable(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

export const resultIdParamSchema = z.string().uuid('Invalid result ID');

export const listResultsQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
    student_id: z.string().uuid().optional(),
    exam_id: z.string().uuid().optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export type CreateResultInput = z.infer<typeof createResultSchema>;
export type UpdateResultInput = z.infer<typeof updateResultSchema>;
export type ListResultsQuery = z.infer<typeof listResultsQuerySchema>;

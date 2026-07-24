import { z } from 'zod';

export const createSubjectSchema = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    code: z.string().trim().min(1, 'Code is required'),
    description: z.string().optional().nullable(),
});

export const updateSubjectSchema = z
    .object({
        name: z.string().trim().min(1).optional(),
        code: z.string().trim().min(1).optional(),
        description: z.string().optional().nullable(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

export const listSubjectsQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
    search: z.string().optional(),
});

export const subjectIdParamSchema = z.string().uuid('Invalid subject ID');

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type ListSubjectsQuery = z.infer<typeof listSubjectsQuerySchema>;

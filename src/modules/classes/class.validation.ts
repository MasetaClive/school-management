import { z } from 'zod';

export const createClassSchema = z.object({
    name: z.string().min(1, 'Class name is required'),
    grade_level: z.coerce.number().int().min(1, 'Grade level is required'),
    academic_year: z.string().min(1, 'Academic year is required'),
});

export const updateClassSchema = z
    .object({
        name: z.string().min(1).optional(),
        grade_level: z.coerce.number().int().min(1).optional(),
        academic_year: z.string().min(1).optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

export const listClassesQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
    search: z.string().optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type ListClassesQuery = z.infer<typeof listClassesQuerySchema>;

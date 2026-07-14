import { z } from 'zod';

export const createClassTeacherSchema = z.object({
    class_id: z.string().uuid('Invalid class ID'),
    teacher_id: z.string().uuid('Invalid teacher ID'),
    is_homeroom: z.boolean().optional().default(false),
    academic_year: z.string().min(1, 'Academic year is required'),
});

export const updateClassTeacherSchema = z.object({
    is_homeroom: z.boolean().optional(),
    academic_year: z.string().min(1, 'Academic year is required').optional(),
});

export const listClassTeachersQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
    class_id: z.string().uuid().optional(),
    teacher_id: z.string().uuid().optional(),
});

export type CreateClassTeacherInput = z.infer<typeof createClassTeacherSchema>;
export type UpdateClassTeacherInput = z.infer<typeof updateClassTeacherSchema>;
export type ListClassTeachersQuery = z.infer<typeof listClassTeachersQuerySchema>;

import { z } from 'zod';

export const createSubjectAssignmentSchema = z.object({
    teacher_id: z.string().uuid('Invalid teacher ID'),
    subject_id: z.string().uuid('Invalid subject ID'),
    class_id: z.string().uuid('Invalid class ID'),
    academic_year: z.string().trim().min(1, 'Academic year is required'),
});

export const updateSubjectAssignmentSchema = z
    .object({
        teacher_id: z.string().uuid().optional(),
        subject_id: z.string().uuid().optional(),
        class_id: z.string().uuid().optional(),
        academic_year: z.string().trim().min(1).optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

export const subjectAssignmentIdParamSchema = z.string().uuid('Invalid assignment ID');

export const listSubjectAssignmentsQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
    teacher_id: z.string().uuid().optional(),
    class_id: z.string().uuid().optional(),
    subject_id: z.string().uuid().optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export type CreateSubjectAssignmentInput = z.infer<typeof createSubjectAssignmentSchema>;
export type UpdateSubjectAssignmentInput = z.infer<typeof updateSubjectAssignmentSchema>;
export type ListSubjectAssignmentsQuery = z.infer<typeof listSubjectAssignmentsQuerySchema>;

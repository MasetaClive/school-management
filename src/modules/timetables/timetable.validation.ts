import { z } from 'zod';

export const createTimetableSchema = z.object({
    class_id: z.string().uuid('Invalid class ID'),
    subject_id: z.string().uuid('Invalid subject ID'),
    teacher_id: z.string().uuid('Invalid teacher ID'),
    time_slot_id: z.string().uuid('Invalid time slot ID'),
    academic_year: z.string().min(1, 'Academic year is required'),
});

export const updateTimetableSchema = z
    .object({
        class_id: z.string().uuid().optional(),
        subject_id: z.string().uuid().optional(),
        teacher_id: z.string().uuid().optional(),
        time_slot_id: z.string().uuid().optional(),
        academic_year: z.string().min(1).optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

export const listTimetablesQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
    class_id: z.string().uuid().optional(),
    teacher_id: z.string().uuid().optional(),
    subject_id: z.string().uuid().optional(),
    time_slot_id: z.string().uuid().optional(),
});

export type CreateTimetableInput = z.infer<typeof createTimetableSchema>;
export type UpdateTimetableInput = z.infer<typeof updateTimetableSchema>;
export type ListTimetablesQuery = z.infer<typeof listTimetablesQuerySchema>;

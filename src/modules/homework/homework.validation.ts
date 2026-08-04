import { z } from 'zod';

const dueDateSchema = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/, 'Invalid due date');

export const createHomeworkSchema = z.object({
    class_id: z.string().uuid('Invalid class ID'),
    subject_id: z.string().uuid('Invalid subject ID'),
    teacher_id: z.string().uuid('Invalid teacher ID'),
    title: z.string().trim().min(3).max(255),
    description: z.string().trim().max(10000).optional().nullable(),
    due_date: dueDateSchema,
    attachment_url: z.string().url().optional().nullable().or(z.literal('')),
    academic_year: z.string().trim().min(1, 'Academic year is required'),
});

export const updateHomeworkSchema = createHomeworkSchema.partial().refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: 'At least one field must be provided for update' },
);

export const homeworkIdParamSchema = z.string().uuid('Invalid homework ID');

export const listHomeworkQuerySchema = z.object({
    class_id: z.string().uuid().optional(),
    teacher_id: z.string().uuid().optional(),
    subject_id: z.string().uuid().optional(),
    academic_year: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    search: z.string().trim().min(1).max(100).optional(),
    due_before: dueDateSchema.optional(),
    due_after: dueDateSchema.optional(),
});

export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;
export type UpdateHomeworkInput = z.infer<typeof updateHomeworkSchema>;
export type ListHomeworkQuery = z.infer<typeof listHomeworkQuerySchema>;

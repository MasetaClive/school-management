import { z } from 'zod';

export const createHomeworkSchema = z.object({
    class_id: z.string().uuid(),
    subject_id: z.string().uuid(),
    teacher_id: z.string().uuid(),
    title: z.string().min(3).max(255),
    description: z.string().optional(),
    due_date: z.string().datetime(),
    attachment_url: z.string().url().optional().or(z.literal('')),
    academic_year: z.string().min(4),
});

export const updateHomeworkSchema = createHomeworkSchema.partial();

export const listHomeworkQuerySchema = z.object({
    class_id: z.string().uuid().optional(),
    teacher_id: z.string().uuid().optional(),
    subject_id: z.string().uuid().optional(),
    academic_year: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
});

export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;
export type UpdateHomeworkInput = z.infer<typeof updateHomeworkSchema>;
export type ListHomeworkQuery = z.infer<typeof listHomeworkQuerySchema>;

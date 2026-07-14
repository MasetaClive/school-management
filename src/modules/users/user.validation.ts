import { z } from 'zod';

const userBaseSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'teacher', 'student', 'parent']),
  full_name: z.string().optional(),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  student_id: z.string().uuid().optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  teacher_id: z.string().uuid().optional().nullable(),
});

export const createUserSchema = userBaseSchema.refine(data => {
  const ids = [data.student_id, data.parent_id, data.teacher_id].filter(Boolean);
  return ids.length <= 1;
}, {
  message: "Only one entity (student, parent, or teacher) can be linked at a time",
  path: ['student_id']
});

export const listUsersQuerySchema = z.object({
  page: z.preprocess((val) => Number(val), z.number().min(1).default(1)),
  search: z.string().optional(),
  role: z.enum(['admin', 'teacher', 'student', 'parent']).optional(),
});

// Now we can use .partial() on the base schema without refinements
export const updateUserSchema = userBaseSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

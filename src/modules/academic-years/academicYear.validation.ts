import { z } from 'zod';

export const createAcademicYearSchema = z.object({
  year: z.string().min(1, 'Year is required'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
});

export const updateAcademicYearSchema = z.object({
  is_active: z.boolean().optional(),
  is_closed: z.boolean().optional(),
});

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;

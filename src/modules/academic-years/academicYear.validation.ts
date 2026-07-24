import { z } from 'zod';

export const createAcademicYearSchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'Year must be a four-digit value'),
  start_date: z.string().date().optional().nullable(),
  end_date: z.string().date().optional().nullable(),
}).refine(
  (data) => !data.start_date || !data.end_date || data.start_date <= data.end_date,
  { message: 'End date must be on or after the start date', path: ['end_date'] },
);

export const updateAcademicYearSchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'Year must be a four-digit value').optional(),
  start_date: z.string().date().nullable().optional(),
  end_date: z.string().date().nullable().optional(),
  is_active: z.boolean().optional(),
  is_closed: z.boolean().optional(),
}).refine(
  (data) => !data.start_date || !data.end_date || data.start_date <= data.end_date,
  { message: 'End date must be on or after the start date', path: ['end_date'] },
);

export const listAcademicYearsQuerySchema = z.object({
  page: z.string().transform((value) => Math.max(1, Number(value) || 1)).optional(),
  search: z.string().optional(),
});

export const academicYearIdParamSchema = z.string().uuid('Invalid academic year ID');

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;
export type ListAcademicYearsQuery = z.infer<typeof listAcademicYearsQuerySchema>;

import { z } from 'zod';

const schoolInfoSchema = z.object({
    name: z.string().trim().min(1, 'School name is required').max(150),
    address: z.string().trim().max(300).optional().default(''),
    phone: z.string().trim().max(40).optional().default(''),
}).strict();

const academicConfigSchema = z.object({
    current_year: z.string().trim().min(1, 'Academic year is required').max(50),
    current_term: z.enum(['Term 1', 'Term 2', 'Term 3']).optional().default('Term 1'),
}).strict();

export const updateSettingsSchema = z.discriminatedUnion('key', [
    z.object({ key: z.literal('school_info'), value: schoolInfoSchema }),
    z.object({ key: z.literal('academic_config'), value: academicConfigSchema }),
]);

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

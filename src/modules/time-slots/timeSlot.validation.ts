import { z } from 'zod';

export const createTimeSlotSchema = z
    .object({
        day_of_week: z.number().int().min(0).max(6),
        start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Invalid time format (HH:MM)'),
        end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Invalid time format (HH:MM)'),
    })
    .refine((data) => data.end_time > data.start_time, {
        message: 'End time must be after start time',
        path: ['end_time'],
    });

export const updateTimeSlotSchema = z
    .object({
        day_of_week: z.number().int().min(0).max(6).optional(),
        start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).optional(),
        end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).optional(),
    })
    .refine(
        (data) => {
            if (data.start_time && data.end_time) {
                return data.end_time > data.start_time;
            }
            return true;
        },
        {
            message: 'End time must be after start time',
            path: ['end_time'],
        }
    )
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
        message: 'At least one field must be provided for update',
    });

export const listTimeSlotsQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
});

export type CreateTimeSlotInput = z.infer<typeof createTimeSlotSchema>;
export type UpdateTimeSlotInput = z.infer<typeof updateTimeSlotSchema>;
export type ListTimeSlotsQuery = z.infer<typeof listTimeSlotsQuerySchema>;

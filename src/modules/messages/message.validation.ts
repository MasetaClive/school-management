import { z } from 'zod';

export const createMessageSchema = z.object({
    recipient_id: z.string().uuid('Invalid recipient ID'),
    subject: z.string().max(255).optional().nullable(),
    body: z.string().min(1, 'Message body is required'),
});

export const listMessagesQuerySchema = z.object({
    page: z
        .string()
        .transform((v) => {
            const n = Number(v);
            return Number.isNaN(n) || n < 1 ? 1 : n;
        })
        .optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

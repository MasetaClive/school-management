import { z } from 'zod';

export const createFeeTypeSchema = z.object({
    name: z.string().min(3).max(255),
    description: z.string().optional(),
    amount: z.coerce.number().min(0),
    academic_year: z.string().min(4),
});

export const createStudentFeeSchema = z.object({
    student_id: z.string().uuid(),
    fee_type_id: z.string().uuid(),
    total_amount: z.coerce.number().min(0),
    due_date: z.string().date().optional(),
    academic_year: z.string(),
});

export const recordPaymentSchema = z.object({
    student_fee_id: z.string().uuid(),
    amount_paid: z.coerce.number().positive(),
    payment_method: z.enum(['cash', 'bank_transfer', 'card']),
    reference_number: z.string().optional(),
    notes: z.string().optional(),
});

export type CreateFeeTypeInput = z.infer<typeof createFeeTypeSchema>;
export type CreateStudentFeeInput = z.infer<typeof createStudentFeeSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

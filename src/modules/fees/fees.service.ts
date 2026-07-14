import { createClient } from '@/lib/supabase/server';
import type { CreateFeeTypeInput, CreateStudentFeeInput, RecordPaymentInput } from './fees.validation';

export class FeesServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class FeesService {
    static async createFeeType(input: CreateFeeTypeInput) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('fee_types')
            .insert(input)
            .select('*')
            .single();

        if (error) throw new FeesServiceError('Failed to create fee type', 500);
        return data;
    }

    static async listFeeTypes(academicYear?: string) {
        const supabase = await createClient();
        let req = supabase.from('fee_types').select('*').order('name');
        if (academicYear) req = req.eq('academic_year', academicYear);
        const { data, error } = await req;
        if (error) {
            console.error('[FeesService] listFeeTypes error:', error);
            throw new FeesServiceError('Failed to fetch fee types', 500);
        }
        return data;
    }

    static async assignFeeToStudent(input: CreateStudentFeeInput) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('student_fees')
            .insert(input)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') throw new FeesServiceError('Fee already assigned to this student', 409);
            throw new FeesServiceError('Failed to assign fee', 500);
        }
        return data;
    }

    static async recordPayment(input: RecordPaymentInput, userId: string) {
        const supabase = await createClient();

        // 1. Get current fee status
        const { data: studentFee, error: fetchError } = await supabase
            .from('student_fees')
            .select('*')
            .eq('id', input.student_fee_id)
            .single();

        if (fetchError || !studentFee) throw new FeesServiceError('Student fee record not found', 404);

        const newPaidAmount = Number(studentFee.paid_amount) + input.amount_paid;
        const totalAmount = Number(studentFee.total_amount);

        if (newPaidAmount > totalAmount) {
            throw new FeesServiceError(`Payment exceeds outstanding balance. Max allowed: ${totalAmount - studentFee.paid_amount}`, 400);
        }

        // 2. Perform transaction: record payment and update fee status
        // Note: Using individual calls here for simplicity, in production would use a RPC or specialized service.
        
        const { error: paymentError } = await supabase
            .from('fee_payments')
            .insert({
                ...input,
                recorded_by: userId
            });

        if (paymentError) throw new FeesServiceError('Failed to record payment', 500);

        const newStatus = newPaidAmount >= totalAmount ? 'paid' : 'partial';

        const { data: updatedFee, error: updateError } = await supabase
            .from('student_fees')
            .update({
                paid_amount: newPaidAmount,
                status: newStatus
            })
            .eq('id', input.student_fee_id)
            .select('*')
            .single();

        if (updateError) throw new FeesServiceError('Failed to update fee status', 500);

        return { payment: input, updatedFee };
    }

    static async getStudentBalances(studentId: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('student_fees')
            .select(`
                *,
                fee_type:fee_types(name, description)
            `)
            .eq('student_id', studentId);

        if (error) throw new FeesServiceError('Failed to fetch student balances', 500);
        return data;
    }
}

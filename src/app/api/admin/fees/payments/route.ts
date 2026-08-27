import { NextRequest } from 'next/server';
import { FeesRoutes } from '@/modules/fees/fees.routes';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    return FeesRoutes.RECORD_PAYMENT(req);
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('fee_payments')
            .select(`
                id,
                amount_paid,
                payment_date,
                payment_method,
                reference_number,
                notes,
                created_at,
                student_fee:student_fees(
                    id,
                    academic_year,
                    student:students(
                        id,
                        student_id,
                        full_name
                    ),
                    fee_type:fee_types(
                        id,
                        name
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[payments GET] error', error);
            return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
        }
        
        return NextResponse.json(data || []);
    } catch (e) {
        console.error('[payments GET] unexpected error', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

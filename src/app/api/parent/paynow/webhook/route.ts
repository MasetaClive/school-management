import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { PaynowService, verifyPaynowHash } from '@/services/paynow.service';
import { FeesService } from '@/modules/fees/fees.service';
import { NotificationService } from '@/services/notification.service';

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let fields: Record<string, string> = {};

        // Parse url-encoded webhook payload
        if (contentType.includes('application/x-www-form-urlencoded')) {
            const bodyText = await req.text();
            const params = new URLSearchParams(bodyText);
            for (const [k, v] of params.entries()) {
                fields[k] = v;
            }
        } else {
            // Json format fallback
            fields = await req.json();
        }

        const reference = fields.reference;
        const status = fields.status; // 'Paid', 'Sent', 'Failed', 'Cancelled'
        const paynowReference = fields.paynowreference || fields.paynow_reference || '';

        if (!reference || !status) {
            return NextResponse.json({ error: 'Missing webhook reference or status' }, { status: 400 });
        }

        // 1. Retrieve the registered transaction
        const tx = await PaynowService.getTransaction(reference);
        if (!tx) {
            console.error(`[PaynowWebhook] Transaction reference not found in database: ${reference}`);
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Webhook Idempotency: Ignore already processed success transactions
        if (tx.status === 'success') {
            console.log(`[PaynowWebhook] Webhook ignored. Transaction ${reference} was already successfully processed.`);
            return NextResponse.json({ status: 'already_processed' });
        }

        // 2. Verify signature hash (only if key is configured in env variables)
        const paynowKey = process.env.PAYNOW_INTEGRATION_KEY;
        if (paynowKey && paynowKey !== 'your-integration-key') {
            const isVerified = verifyPaynowHash(fields, paynowKey);
            if (!isVerified) {
                console.error(`[PaynowWebhook] Signature hash verification failed for reference: ${reference}`);
                return NextResponse.json({ error: 'Invalid payload signature' }, { status: 400 });
            }
        }

        // 3. Process payment status changes
        if (status === 'Paid' || status === 'Delivered') {
            console.log(`[PaynowWebhook] Payment verified! Reference: ${reference}, Amount: $${tx.amount}`);

            const supabase = await createAdminClient();

            // Retrieve a system administrator user ID to associate as recorded_by in fee_payments
            const { data: adminUser } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'admin')
                .limit(1)
                .maybeSingle();

            const recordedBy = adminUser?.id;
            if (!recordedBy) {
                console.error('[PaynowWebhook] No admin user profile found to record transaction.');
                return NextResponse.json({ error: 'Admin recorder account not found' }, { status: 500 });
            }

            // Record transaction in official database fee_payments & update student_fees totals
            await FeesService.recordPayment({
                student_fee_id: tx.student_fee_id,
                amount_paid: Number(tx.amount),
                payment_method: tx.payment_method as any,
                reference_number: reference,
                notes: `Paynow Online Payment. Gateway Ref: ${paynowReference}`
            }, recordedBy, supabase);

            // Update Paynow Transaction status to success in DB
            await PaynowService.updateTransactionStatus(reference, 'success', paynowReference);

            // Fetch student name and parent details to trigger SMS/Email notifications
            const { data: studentFee } = await supabase
                .from('student_fees')
                .select('student_id, fee_type:fee_types(name)')
                .eq('id', tx.student_fee_id)
                .maybeSingle();

            if (studentFee) {
                const feeObj: any = studentFee;
                const { data: student } = await supabase
                    .from('students')
                    .select(`
                        full_name,
                        student_id,
                        parent:parents(
                            full_name,
                            email,
                            phone
                        )
                    `)
                    .eq('id', studentFee.student_id)
                    .maybeSingle();

                if (student) {
                    const studentObj: any = student;
                    const parentObj = studentObj.parent || {};
                    
                    // Dispatch transactional receipt alerts
                    void NotificationService.sendPaymentReceiptNotification({
                        studentName: studentObj.full_name,
                        studentId: studentObj.student_id,
                        amount: Number(tx.amount),
                        reference: reference,
                        feeName: (Array.isArray(feeObj.fee_type) ? feeObj.fee_type[0]?.name : feeObj.fee_type?.name) || 'School Fees',
                        email: parentObj.email || tx.authemail,
                        phone: parentObj.phone || ''
                    });
                }
            }

        } else if (status === 'Failed') {
            console.log(`[PaynowWebhook] Transaction failed for reference: ${reference}`);
            await PaynowService.updateTransactionStatus(reference, 'failed', paynowReference);
        } else if (status === 'Cancelled') {
            console.log(`[PaynowWebhook] Transaction cancelled for reference: ${reference}`);
            await PaynowService.updateTransactionStatus(reference, 'cancelled', paynowReference);
        }

        return NextResponse.json({ status: 'ok' });

    } catch (e) {
        console.error('[PaynowWebhook] Error parsing webhook response:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

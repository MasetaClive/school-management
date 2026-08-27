import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { PaynowService, generatePaynowHash } from '@/services/paynow.service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { student_fee_id, amount, payment_method, authemail } = body;

        if (!student_fee_id || !amount || !payment_method || !authemail) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
        }

        // 1. Fetch student fee account balance from DB to verify overpayment constraints
        const supabase = await createAdminClient();
        const { data: studentFee, error: fetchError } = await supabase
            .from('student_fees')
            .select('*, fee_type:fee_types(name)')
            .eq('id', student_fee_id)
            .maybeSingle();

        if (fetchError || !studentFee) {
            return NextResponse.json({ error: 'Student fee account not found' }, { status: 404 });
        }

        const outstanding = Number(studentFee.total_amount) - Number(studentFee.paid_amount);
        if (amt > outstanding) {
            return NextResponse.json({ 
                error: `Payment exceeds outstanding balance. Max allowed: $${outstanding.toFixed(2)}` 
            }, { status: 400 });
        }

        // 2. Generate unique internal reference
        const referenceNumber = `SMS-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const paynowId = process.env.PAYNOW_INTEGRATION_ID;
        const paynowKey = process.env.PAYNOW_INTEGRATION_KEY;

        // Determine request origin URL to construct return path
        const origin = req.nextUrl.origin;
        const returnUrl = `${origin}/parent/finance?status=success&ref=${referenceNumber}`;
        const resultUrl = `${origin}/api/parent/paynow/webhook`;

        // If Paynow integration is not fully configured, fall back to sandbox checkout simulator
        if (!paynowId || !paynowKey || paynowId === 'your-integration-id') {
            console.log('[PaynowInitiate] Paynow keys not configured. Falling back to checkout simulator.');
            
            // Save transaction as pending in DB
            await PaynowService.saveTransaction({
                student_fee_id,
                amount: amt,
                status: 'pending',
                reference_number: referenceNumber,
                payment_method,
                authemail,
                poll_url: `${origin}/api/parent/paynow/poll?ref=${referenceNumber}`
            });

            // Redirect user to the simulator page
            const simulatorUrl = `/parent/finance/paynow-simulator?ref=${referenceNumber}&amount=${amt}&student_fee_id=${student_fee_id}&payment_method=${payment_method}&email=${encodeURIComponent(authemail)}`;
            return NextResponse.json({ redirectUrl: simulatorUrl });
        }

        // 3. Initiate payment session on Paynow Zimbabwe Gateway
        // Construct transaction fields
        const fields: Record<string, string> = {
            resulturl: resultUrl,
            returnurl: returnUrl,
            reference: referenceNumber,
            amount: amt.toFixed(2),
            id: paynowId,
            additionalinfo: `School Fees Payment - ${studentFee.fee_type?.name || 'Category'}`,
            authemail: authemail,
            status: 'Message'
        };

        // EcoCash direct vs Web redirect (Visa/Mastercard)
        if (payment_method === 'ecocash') {
            // EcoCash requires direct billing inputs in Paynow API
            fields.method = 'ecocash';
        }

        // Append signature hash
        fields.hash = generatePaynowHash(fields, paynowKey);

        // Send url-encoded POST request
        const urlParams = new URLSearchParams();
        for (const [k, v] of Object.entries(fields)) {
            urlParams.append(k, v);
        }

        const paynowRes = await fetch('https://www.paynow.co.zw/interface/initiatetransaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: urlParams.toString()
        });

        if (!paynowRes.ok) {
            const errText = await paynowRes.text();
            console.error('[PaynowInitiate] Paynow server connection error:', errText);
            return NextResponse.json({ error: 'Failed to initiate transaction with payment gateway' }, { status: 502 });
        }

        const resText = await paynowRes.text();
        const params = new URLSearchParams(resText);
        const status = params.get('status');

        if (status !== 'Ok') {
            const errorMsg = params.get('error') || 'Unknown gateway rejection';
            console.error('[PaynowInitiate] Gateway rejected payment initiation:', errorMsg);
            return NextResponse.json({ error: `Payment gateway rejected initiation: ${errorMsg}` }, { status: 400 });
        }

        const browserUrl = params.get('browserurl') || '';
        const pollUrl = params.get('pollurl') || '';

        // Save transaction as pending in DB
        await PaynowService.saveTransaction({
            student_fee_id,
            amount: amt,
            status: 'pending',
            reference_number: referenceNumber,
            payment_method,
            authemail,
            poll_url: pollUrl
        });

        return NextResponse.json({ redirectUrl: browserUrl });

    } catch (e) {
        console.error('[PaynowInitiate] unexpected error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

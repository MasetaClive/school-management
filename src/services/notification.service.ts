export interface ReceiptNotificationInput {
    studentName: string;
    studentId: string;
    amount: number;
    reference: string;
    feeName: string;
    email: string;
    phone: string;
}

export class NotificationService {
    static async sendPaymentReceiptNotification(input: ReceiptNotificationInput) {
        console.log(`[NotificationService] Initiating receipt alerts for reference ${input.reference}`);

        // 1. Send SMS Notification (Simulation)
        const smsMessage = `Dear Parent, a payment of $${input.amount.toFixed(2)} for ${input.studentName} (${input.feeName}) was successfully processed. Ref: ${input.reference}. Thank you.`;
        console.log(`[SMS OUTBOX] Target: ${input.phone || '+263XXXXXXXXX'}`);
        console.log(`[SMS OUTBOX] Message: "${smsMessage}"`);

        // 2. Send Email Notification (Loops API with console fallback)
        const loopsApiKey = process.env.LOOPS_API_KEY;
        const recipientEmail = input.email || 'parent@school.local';

        if (loopsApiKey && loopsApiKey !== 'your-loops-api-key') {
            try {
                const res = await fetch('https://api.loops.so/v1/transactional', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${loopsApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: recipientEmail,
                        transactionalId: 'payment-receipt', // Identifier for the transaction receipt template
                        dataVariables: {
                            studentName: input.studentName,
                            studentId: input.studentId,
                            amount: `$${input.amount.toFixed(2)}`,
                            reference: input.reference,
                            feeName: input.feeName,
                            date: new Date().toISOString().split('T')[0]
                        }
                    })
                });
                
                if (res.ok) {
                    console.log(`[NotificationService] Loops transactional email dispatched successfully to ${recipientEmail}`);
                } else {
                    const errText = await res.text();
                    console.warn(`[NotificationService] Loops API returned status ${res.status}: ${errText}`);
                }
            } catch (e) {
                console.error('[NotificationService] Error sending email via Loops API:', e);
            }
        } else {
            // Log fallback simulated email body
            console.log(`[EMAIL OUTBOX] To: ${recipientEmail}`);
            console.log(`[EMAIL OUTBOX] Subject: Payment Receipt Confirmation - ${input.reference}`);
            console.log(`[EMAIL OUTBOX] Body:
----------------------------------------
OFFICIAL PAYMENT RECEIPT
----------------------------------------
Student: ${input.studentName} (#${input.studentId})
Fee Category: ${input.feeName}
Amount Paid: $${input.amount.toFixed(2)}
Payment Ref: ${input.reference}
Date: ${new Date().toISOString().split('T')[0]}
Status: Success

Thank you for your payment.
----------------------------------------`);
        }
    }
}

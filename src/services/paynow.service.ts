import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

export interface PaynowTransaction {
    id?: string;
    student_fee_id: string;
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    paynow_reference?: string;
    reference_number: string;
    payment_method: string;
    authemail: string;
    poll_url?: string;
    created_at?: string;
    updated_at?: string;
}

// Generate Paynow SHA-512 signature hash
export function generatePaynowHash(fields: Record<string, string>, integrationKey: string): string {
    // Sort keys or follow specific order. In Paynow, fields must be concatenated in the documented order.
    // We will concatenate values of all keys except 'hash' in insertion order or sorted order.
    // Standard signature concatenates values of all properties except 'hash'
    const valuesString = Object.keys(fields)
        .filter(key => key !== 'hash')
        .map(key => fields[key])
        .join('');
    
    const raw = valuesString + integrationKey;
    return createHash('sha512').update(raw, 'utf-8').digest('hex').toUpperCase();
}

// Verify incoming Paynow webhook message signature
export function verifyPaynowHash(fields: Record<string, string>, integrationKey: string): boolean {
    const receivedHash = fields.hash;
    if (!receivedHash) return false;
    const computedHash = generatePaynowHash(fields, integrationKey);
    return receivedHash.toUpperCase() === computedHash;
}

export class PaynowService {
    // Save transaction state using defensive database adapter (table vs settings fallback)
    static async saveTransaction(tx: PaynowTransaction) {
        const supabase = await createAdminClient();
        
        // 1. Try saving into paynow_transactions table
        const { data, error } = await supabase
            .from('paynow_transactions')
            .insert({
                student_fee_id: tx.student_fee_id,
                amount: tx.amount,
                status: tx.status,
                reference_number: tx.reference_number,
                payment_method: tx.payment_method,
                authemail: tx.authemail,
                poll_url: tx.poll_url || null,
                paynow_reference: tx.paynow_reference || null
            })
            .select('*')
            .maybeSingle();

        if (error && error.message.includes('relation "public.paynow_transactions" does not exist')) {
            // 2. Fall back to settings table
            const key = `paynow_txn_${tx.reference_number}`;
            const fallbackValue = {
                ...tx,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { error: settingsError } = await supabase
                .from('settings')
                .insert({
                    key,
                    value: fallbackValue
                });
                
            if (settingsError) {
                console.error('[PaynowService] settings fallback failed:', settingsError);
                throw new Error('Database write error: Failed to log transaction in settings fallback');
            }
            return fallbackValue;
        }

        if (error) {
            console.error('[PaynowService] saveTransaction error:', error);
            throw new Error(`Database write error: ${error.message}`);
        }

        return data;
    }

    // Get logged transaction by internal reference
    static async getTransaction(referenceNumber: string): Promise<PaynowTransaction | null> {
        const supabase = await createAdminClient();
        
        // 1. Try querying paynow_transactions table
        const { data, error } = await supabase
            .from('paynow_transactions')
            .select('*')
            .eq('reference_number', referenceNumber)
            .maybeSingle();

        if (error && error.message.includes('relation "public.paynow_transactions" does not exist')) {
            // 2. Fall back to settings table
            const key = `paynow_txn_${referenceNumber}`;
            const { data: settingsData, error: settingsError } = await supabase
                .from('settings')
                .select('value')
                .eq('key', key)
                .maybeSingle();

            if (settingsError || !settingsData) return null;
            return settingsData.value as PaynowTransaction;
        }

        return data;
    }

    // Update logged transaction status
    static async updateTransactionStatus(referenceNumber: string, status: 'pending' | 'success' | 'failed' | 'cancelled', paynowReference?: string) {
        const supabase = await createAdminClient();
        
        // 1. Try updating paynow_transactions table
        const { data, error } = await supabase
            .from('paynow_transactions')
            .update({
                status,
                paynow_reference: paynowReference || null,
                updated_at: new Date().toISOString()
            })
            .eq('reference_number', referenceNumber)
            .select('*');

        if (error && error.message.includes('relation "public.paynow_transactions" does not exist')) {
            // 2. Fall back to settings table
            const key = `paynow_txn_${referenceNumber}`;
            const { data: current, error: settingsError } = await supabase
                .from('settings')
                .select('value')
                .eq('key', key)
                .maybeSingle();

            if (!settingsError && current) {
                const val = {
                    ...current.value,
                    status,
                    paynow_reference: paynowReference || null,
                    updated_at: new Date().toISOString()
                };
                await supabase
                    .from('settings')
                    .update({ value: val })
                    .eq('key', key);
            }
        }
    }
}

import { FeesService } from '../fees.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('FeesService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('records a payment and marks a fully paid fee as paid', async () => {
    const feeLookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'fee-id', paid_amount: 50, total_amount: 100 }, error: null }) };
    const paymentInsert = { insert: jest.fn().mockResolvedValue({ error: null }) };
    const feeUpdate = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'fee-id', paid_amount: 100, status: 'paid' }, error: null }) };
    const client = { from: jest.fn().mockReturnValueOnce(feeLookup).mockReturnValueOnce(paymentInsert).mockReturnValueOnce(feeUpdate) } as never;

    const result = await FeesService.recordPayment({ student_fee_id: 'fee-id', amount_paid: 50, payment_method: 'cash' }, 'user-id', client);

    expect(result.updatedFee).toEqual({ id: 'fee-id', paid_amount: 100, status: 'paid' });
    expect(paymentInsert.insert).toHaveBeenCalledWith(expect.objectContaining({ recorded_by: 'user-id', amount_paid: 50 }));
    expect(feeUpdate.update).toHaveBeenCalledWith({ paid_amount: 100, status: 'paid' });
  });

  it('rejects a payment that exceeds the total fee', async () => {
    const feeLookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { paid_amount: 25, total_amount: 100 }, error: null }) };
    const client = { from: jest.fn().mockReturnValue(feeLookup) } as never;

    await expect(FeesService.recordPayment({ student_fee_id: 'fee-id', amount_paid: 76, payment_method: 'card' }, 'user-id', client)).rejects.toMatchObject({
      message: 'Payment exceeds outstanding balance. Max allowed: 75',
      status: 400,
    });
  });

  it('rejects a payment when the student fee does not exist', async () => {
    const feeLookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }) };
    const client = { from: jest.fn().mockReturnValue(feeLookup) } as never;

    await expect(FeesService.recordPayment({ student_fee_id: 'fee-id', amount_paid: 10, payment_method: 'cash' }, 'user-id', client)).rejects.toMatchObject({ message: 'Student fee record not found', status: 404 });
  });

  it('maps payment insertion failures to a server error', async () => {
    const feeLookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { paid_amount: 0, total_amount: 100 }, error: null }) };
    const paymentInsert = { insert: jest.fn().mockResolvedValue({ error: { message: 'Database error' } }) };
    const client = { from: jest.fn().mockReturnValueOnce(feeLookup).mockReturnValueOnce(paymentInsert) } as never;

    await expect(FeesService.recordPayment({ student_fee_id: 'fee-id', amount_paid: 10, payment_method: 'bank_transfer' }, 'user-id', client)).rejects.toMatchObject({ message: 'Failed to record payment', status: 500 });
  });
});
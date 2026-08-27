import { NextRequest } from 'next/server';

const mockCreateClient = jest.fn();
const mockCreateAdminClient = jest.fn();
const mockGetUserRole = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockSaveTransaction = jest.fn();
const mockGetTransaction = jest.fn();
const mockUpdateTransactionStatus = jest.fn();
const mockGenerateHash = jest.fn(() => 'hash');
const mockVerifyHash = jest.fn(() => true);
const mockRecordPayment = jest.fn();
const mockReceipt = jest.fn();

jest.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient, createAdminClient: mockCreateAdminClient }));
jest.mock('@/lib/auth', () => ({ getUserRole: mockGetUserRole, getCurrentUser: mockGetCurrentUser }));
jest.mock('@/services/paynow.service', () => ({
  PaynowService: { saveTransaction: mockSaveTransaction, getTransaction: mockGetTransaction, updateTransactionStatus: mockUpdateTransactionStatus },
  generatePaynowHash: mockGenerateHash,
  verifyPaynowHash: mockVerifyHash,
}));
jest.mock('@/modules/fees/fees.service', () => ({ FeesService: { recordPayment: mockRecordPayment } }));
jest.mock('@/services/notification.service', () => ({ NotificationService: { sendPaymentReceiptNotification: mockReceipt } }));

import { GET as callback } from '../auth/callback/route';
import { POST as changePassword } from '../auth/password/route';
import { GET as role } from '../auth/role/route';
import { POST as agent } from '../agents/summary/route';
import { POST as attendance } from '../attendance/route';
import { POST as initiate } from '../parent/paynow/initiate/route';
import { POST as webhook } from '../parent/paynow/webhook/route';

const req = (url: string, body?: unknown, method = 'POST') => new NextRequest(url, {
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
});
const feeQuery = (fee: unknown, error: unknown = null) => ({
  select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: fee, error }),
});

describe('non-admin auth, agent, attendance, and Paynow routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PAYNOW_INTEGRATION_ID;
    delete process.env.PAYNOW_INTEGRATION_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  it('redirects callback success and failure to the expected origin paths', async () => {
    const exchange = jest.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({ auth: { exchangeCodeForSession: exchange } });
    expect((await callback(new Request('http://localhost/api/auth/callback?code=c&next=/home'))).headers.get('location')).toBe('http://localhost/home');
    exchange.mockResolvedValue({ error: new Error('bad') });
    expect((await callback(new Request('http://localhost/api/auth/callback?code=c'))).headers.get('location')).toBe('http://localhost/login?error=auth');
  });

  it('returns role and covers password auth, validation, update failure, and success', async () => {
    mockGetUserRole.mockResolvedValue('teacher');
    await expect(role()).resolves.toMatchObject({ status: 200 });
    const updateUser = jest.fn();
    const getUser = jest.fn().mockResolvedValue({ data: { user: null }, error: new Error('none') });
    mockCreateClient.mockResolvedValue({ auth: { getUser, updateUser } });
    expect((await changePassword(req('http://localhost/api/auth/password', { password: 'secret' }))).status).toBe(401);
    getUser.mockResolvedValue({ data: { user: { user_metadata: { role: 'student' } } }, error: null });
    expect((await changePassword(req('http://localhost/api/auth/password', { password: 'short' }))).status).toBe(400);
    updateUser.mockResolvedValue({ error: new Error('update failed') });
    expect((await changePassword(req('http://localhost/api/auth/password', { password: 'secret' }))).status).toBe(400);
    updateUser.mockResolvedValue({ error: null });
    expect((await changePassword(req('http://localhost/api/auth/password', { password: 'secret' }))).status).toBe(200);
    expect(updateUser).toHaveBeenLastCalledWith({ password: 'secret', data: { role: 'student', force_password_change: false } });
  });

  it('validates attendance role and input, then reports student and database failures', async () => {
    mockGetUserRole.mockResolvedValue('student');
    expect((await attendance(req('http://localhost/api/attendance', {}))).status).toBe(403);
    mockGetUserRole.mockResolvedValue('teacher');
    expect((await attendance(req('http://localhost/api/attendance', {}))).status).toBe(400);
    const studentQuery = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: new Error('missing') }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(studentQuery) });
    expect((await attendance(req('http://localhost/api/attendance', { studentId: '00000000-0000-4000-8000-000000000001', date: '2026-08-27', status: 'present' }))).status).toBe(404);
  });

  it('returns agent configuration, OpenAI success, and upstream failure', async () => {
    expect((await agent(req('http://localhost/api/agents/summary', { attendanceData: 'a', gradesData: 'g' }))).status).toBe(500);
    process.env.OPENAI_API_KEY = 'key';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: '{"riskLevel":"low"}' } }] }) }) as jest.Mock;
    expect((await agent(req('http://localhost/api/agents/summary', { attendanceData: 'a', gradesData: 'g' }))).status).toBe(200);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503, text: async () => 'down' });
    expect((await agent(req('http://localhost/api/agents/summary', { attendanceData: 'a', gradesData: 'g' }))).status).toBe(500);
  });

  it('initiates simulator and configured Paynow branches with balance validation', async () => {
    const fee = { total_amount: 100, paid_amount: 25, fee_type: { name: 'Tuition' } };
    mockCreateAdminClient.mockResolvedValue({ from: jest.fn().mockReturnValue(feeQuery(fee)) });
    expect((await initiate(req('http://localhost/api/parent/paynow/initiate', { student_fee_id: 'fee', amount: 80, payment_method: 'card', authemail: 'p@x.test' }))).status).toBe(400);
    expect((await initiate(req('http://localhost/api/parent/paynow/initiate', { student_fee_id: 'fee', amount: 50, payment_method: 'card', authemail: 'p@x.test' }))).status).toBe(200);
    expect(mockSaveTransaction).toHaveBeenCalled();
    process.env.PAYNOW_INTEGRATION_ID = 'id';
    process.env.PAYNOW_INTEGRATION_KEY = 'key';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => 'status=Ok&browserurl=https%3A%2F%2Fpaynow.test&pollurl=poll' }) as jest.Mock;
    expect((await initiate(req('http://localhost/api/parent/paynow/initiate', { student_fee_id: 'fee', amount: 50, payment_method: 'ecocash', authemail: 'p@x.test' }))).status).toBe(200);
    expect(mockGenerateHash).toHaveBeenCalled();
  });

  it.each([
    ['missing fields', {}, 400], ['unknown transaction', { reference: 'ref', status: 'Failed' }, 404],
  ])('handles webhook %s', async (_name, body, status) => {
    mockGetTransaction.mockResolvedValue(null);
    expect((await webhook(req('http://localhost/api/parent/paynow/webhook', body))).status).toBe(status);
  });

  it('handles webhook idempotency, failed state, and paid recorder failure', async () => {
    mockGetTransaction.mockResolvedValue({ status: 'success' });
    expect((await webhook(req('http://localhost/api/parent/paynow/webhook', { reference: 'r', status: 'Paid' }))).status).toBe(200);
    const tx = { status: 'pending', amount: 10, student_fee_id: 'fee', payment_method: 'card', authemail: 'p@x.test' };
    mockGetTransaction.mockResolvedValue(tx);
    expect((await webhook(req('http://localhost/api/parent/paynow/webhook', { reference: 'r', status: 'Failed' }))).status).toBe(200);
    expect(mockUpdateTransactionStatus).toHaveBeenCalledWith('r', 'failed', '');
    mockCreateAdminClient.mockResolvedValue({ from: jest.fn().mockReturnValue(feeQuery({ id: 'admin' })) });
    mockRecordPayment.mockRejectedValueOnce(new Error('record failed'));
    expect((await webhook(req('http://localhost/api/parent/paynow/webhook', { reference: 'r', status: 'Paid', paynowreference: 'pn' }))).status).toBe(500);
  });
});
import { PayrollService } from '../payroll.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
describe('PayrollService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('calculates net payroll amounts from salary configurations', async () => {
    const configs = { select: jest.fn().mockResolvedValue({ data: [{ teacher_id: 'teacher-id', base_salary: 1000, allowances: 100, deductions: 50 }], error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockResolvedValue({ data: [{ id: 'payroll-id', net_amount: 1050 }], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(configs).mockReturnValueOnce(insert) } as never);
    await expect(PayrollService.generateMonthlyPayroll(8, 2026)).resolves.toEqual([{ id: 'payroll-id', net_amount: 1050 }]);
    expect(insert.insert).toHaveBeenCalledWith([expect.objectContaining({ net_amount: 1050, month: 8, year: 2026, status: 'draft' })]);
  });
  it('maps duplicate payroll generation to a conflict', async () => {
    const configs = { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockResolvedValue({ data: null, error: { code: '23505' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(configs).mockReturnValueOnce(insert) } as never);
    await expect(PayrollService.generateMonthlyPayroll(8, 2026)).rejects.toMatchObject({ message: 'Payroll already generated for 8/2026', status: 409 });
  });

  it('uses default salary values and handles list or configuration errors', async () => {
    const upsert = { upsert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'salary' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(upsert) } as never);
    await expect(PayrollService.setSalaryConfig('teacher', 1000)).resolves.toEqual({ id: 'salary' });
    expect(upsert.upsert).toHaveBeenCalledWith({ teacher_id: 'teacher', base_salary: 1000, allowances: 0, deductions: 0 });

    const configs = { select: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(configs) } as never);
    await expect(PayrollService.generateMonthlyPayroll(8, 2026)).rejects.toMatchObject({ status: 500, message: 'Failed to fetch salary configurations' });
    const history = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(history) } as never);
    await expect(PayrollService.listPayrollHistory(2026)).resolves.toEqual([]);
  });
});
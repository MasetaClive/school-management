import { ReportService } from '../report.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
describe('ReportService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('aggregates academic marks by subject and exam', async () => {
    const query = { select: jest.fn().mockResolvedValue({ data: [{ marks_obtained: 80, subject: { name: 'Math' }, exam: { name: 'Final' } }, { marks_obtained: 60, subject: { name: 'Math' }, exam: { name: 'Final' } }], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);
    await expect(ReportService.getAcademicAnalytics()).resolves.toEqual([{ name: 'Math (Final)', average: 70 }]);
  });
  it('returns an empty academic report when the query fails', async () => {
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) }) } as never);
    await expect(ReportService.getAcademicAnalytics()).resolves.toEqual([]);
  });

  it('groups unknown relations and calculates financial and attendance defaults', async () => {
    const academics = { select: jest.fn().mockResolvedValue({ data: [{ marks_obtained: 75, subject: null, exam: null }], error: null }) };
    const fees = { select: jest.fn().mockResolvedValue({ data: [{ amount_paid: '100.50' }, { amount_paid: 25 }], error: null }) };
    const payroll = { select: jest.fn().mockResolvedValue({ data: [{ net_amount: '50' }], error: null }) };
    const attendance = { select: jest.fn().mockResolvedValue({ data: [], error: null }) };
    const from = jest.fn().mockReturnValueOnce(academics).mockReturnValueOnce(fees).mockReturnValueOnce(payroll).mockReturnValueOnce(attendance);
    mockCreateClient.mockResolvedValue({ from } as never);
    await expect(ReportService.getAcademicAnalytics()).resolves.toEqual([{ name: 'Unknown (General)', average: 75 }]);
    await expect(ReportService.getFinancialSummary()).resolves.toEqual({ collections: 125.5, expenses: 50, net: 75.5 });
    await expect(ReportService.getAttendanceTrends()).resolves.toEqual({ attendanceRate: 0 });
  });
});
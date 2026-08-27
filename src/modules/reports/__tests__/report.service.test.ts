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
});
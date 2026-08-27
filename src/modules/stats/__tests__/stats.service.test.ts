import { StatsService } from '../stats.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
describe('StatsService', () => {
  it('combines counts, attendance, activity, and upcoming exams', async () => {
    const count = (value: number) => ({ select: jest.fn().mockReturnThis(), count: value });
    const attendance = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [{ status: 'present' }, { status: 'absent' }], error: null }) };
    const recent = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue({ data: [], error: null }) };
    const exams = { select: jest.fn().mockReturnThis(), gte: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue({ data: [], error: null }) };
    const from = jest.fn().mockReturnValueOnce(count(3)).mockReturnValueOnce(count(2)).mockReturnValueOnce(count(1)).mockReturnValueOnce(count(4)).mockReturnValueOnce(attendance).mockReturnValueOnce(recent).mockReturnValueOnce(recent).mockReturnValueOnce(recent).mockReturnValueOnce(exams);
    mockCreateClient.mockResolvedValue({ from } as never);
    await expect(StatsService.getDashboardStats()).resolves.toMatchObject({ students: 3, teachers: 2, classes: 1, parents: 4, attendance: 50, upcomingEvents: [], recentActivity: [] });
  });
});
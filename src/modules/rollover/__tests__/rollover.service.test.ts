import { RolloverService } from '../rollover.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
describe('RolloverService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('promotes all supplied students and returns the count', async () => {
    const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(update) } as never);
    await expect(RolloverService.promoteStudents([{ student_id: 's1', next_class_id: 'c2' }, { student_id: 's2', next_class_id: 'c3' }])).resolves.toEqual({ success: true, count: 2 });
    expect(update.update).toHaveBeenCalledTimes(2);
  });
  it('reports how many promotions failed', async () => {
    const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValueOnce({ error: { message: 'db' } }).mockResolvedValueOnce({ error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(update) } as never);
    await expect(RolloverService.promoteStudents([{ student_id: 's1', next_class_id: 'c2' }, { student_id: 's2', next_class_id: 'c3' }])).rejects.toMatchObject({ message: '1 students failed to promote', status: 500 });
  });
});
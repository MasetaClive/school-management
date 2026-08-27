import { TransportService } from '../transport.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
describe('TransportService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('upserts a student route assignment', async () => {
    const query = { upsert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'assignment-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);
    await expect(TransportService.assignStudent('student-id', 'route-id', { academic_year: '2026', pickup_point: 'Gate' })).resolves.toEqual({ id: 'assignment-id' });
    expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({ student_id: 'student-id', route_id: 'route-id', academic_year: '2026' }));
  });
  it('treats a missing student route as an empty result', async () => {
    const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);
    await expect(TransportService.getStudentRoute('student-id')).resolves.toBeNull();
  });
});
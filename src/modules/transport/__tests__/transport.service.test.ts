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

  it('lists and creates routes or assignments, including optional fields', async () => {
    const routes = { select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(routes) } as never);
    await expect(TransportService.listRoutes()).resolves.toEqual([]);
    const create = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'route' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(create) } as never);
    await expect(TransportService.createRoute({ name: 'North', vehicle_number: 'BUS-1' })).resolves.toEqual({ id: 'route' });
    expect(create.insert).toHaveBeenCalledWith({ name: 'North', vehicle_number: 'BUS-1' });
  });

  it('maps transport list, route lookup, and assignment errors', async () => {
    const failed = { select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(failed) } as never);
    await expect(TransportService.listRoutes()).rejects.toMatchObject({ status: 500 });
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { code: 'XX000' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(lookup) } as never);
    await expect(TransportService.getStudentRoute('student')).rejects.toMatchObject({ status: 500 });
    const assign = { upsert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(assign) } as never);
    await expect(TransportService.assignStudent('student', 'route', { academic_year: '2026' })).rejects.toMatchObject({ status: 500 });
  });
});
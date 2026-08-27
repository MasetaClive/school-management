import { AnnouncementService } from '../announcement.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
describe('AnnouncementService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('creates a published announcement with the current author', async () => {
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'announcement-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'author-id' } } }) }, from: jest.fn().mockReturnValue(insert) } as never);
    await expect(AnnouncementService.create({ title: 'Holiday', content: 'School closed', is_published: true })).resolves.toEqual({ id: 'announcement-id' });
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ author_id: 'author-id', is_published: true, published_at: expect.any(String) }));
  });
  it('maps list failures to a service error', async () => {
    const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);
    await expect(AnnouncementService.listActive()).rejects.toMatchObject({ message: 'Failed to fetch announcements', status: 500 });
  });
});
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

  it('lists all announcements and creates unpublished announcements without an author', async () => {
    const all = { select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(all) } as never);
    await expect(AnnouncementService.listAll()).resolves.toEqual([]);
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) }, from: jest.fn().mockReturnValue(insert) } as never);
    await expect(AnnouncementService.create({ title: 'Draft', content: 'Content' })).resolves.toEqual({ id: 'id' });
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ author_id: undefined, published_at: null }));
  });

  it('toggles announcement status and maps write failures', async () => {
    const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(update) } as never);
    await expect(AnnouncementService.toggleStatus('id', false)).resolves.toEqual({ success: true });
    expect(update.update).toHaveBeenCalledWith({ is_published: false, published_at: null });
    const failed = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(failed) } as never);
    await expect(AnnouncementService.toggleStatus('id', true)).rejects.toMatchObject({ status: 500 });
  });
});
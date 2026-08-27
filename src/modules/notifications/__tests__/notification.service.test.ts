import { NotificationService } from '../notification.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
describe('NotificationService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('creates an info notification by default', async () => {
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'notification-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(insert) } as never);
    await expect(NotificationService.create({ recipient_email: 'a@example.com', title: 'Notice', message: 'Hello' })).resolves.toEqual({ id: 'notification-id' });
    expect(insert.insert).toHaveBeenCalledWith({ recipient_email: 'a@example.com', event_type: 'info', metadata: { title: 'Notice', body: 'Hello' } });
  });
  it('returns success for markAsRead without a database mutation', async () => {
    await expect(NotificationService.markAsRead('notification-id')).resolves.toEqual({ success: true });
  });
});
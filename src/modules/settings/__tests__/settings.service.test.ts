import { SettingsService } from '../settings.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
describe('SettingsService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('returns a stored settings value', async () => {
    const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { value: { school: 'Demo' } }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);
    await expect(SettingsService.getSettings('school_info')).resolves.toEqual({ school: 'Demo' });
  });
  it('requires the referenced academic year when updating academic config', async () => {
    const year = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(year) } as never);
    await expect(SettingsService.updateSettings({ key: 'academic_config', value: { current_year: '2026' } } as never)).rejects.toMatchObject({ message: 'Academic year not found', status: 404 });
  });
});
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

  it('handles missing settings, validates academic years, and updates school settings', async () => {
    const missing = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(missing) } as never);
    await expect(SettingsService.getSettings('school_info')).rejects.toMatchObject({ status: 404 });

    const year = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'year-id' }, error: null }) };
    const upsert = { upsert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { key: 'academic_config' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(year).mockReturnValueOnce(upsert) } as never);
    await expect(SettingsService.updateSettings({ key: 'academic_config', value: { current_year: '2026' } } as never)).resolves.toEqual({ key: 'academic_config' });

    const school = { upsert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { key: 'school_info' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(school) } as never);
    await expect(SettingsService.updateSettings({ key: 'school_info', value: { name: 'Demo' } } as never)).resolves.toEqual({ key: 'school_info' });
  });

  it('maps settings database and migration errors', async () => {
    const list = { select: jest.fn().mockReturnThis(), in: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: null, error: { code: '42P01' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(list) } as never);
    await expect(SettingsService.listAll()).rejects.toMatchObject({ status: 503 });
  });
});
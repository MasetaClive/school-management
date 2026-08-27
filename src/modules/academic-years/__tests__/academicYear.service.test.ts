import { AcademicYearService } from '../academicYear.service';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('AcademicYearService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates an inactive, open academic year', async () => {
    const year = { id: 'year-id', year: '2026', is_active: false, is_closed: false };
    const query = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: year, error: null }),
    };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);

    await expect(AcademicYearService.createAcademicYear({ year: '2026' })).resolves.toEqual(year);
    expect(query.insert).toHaveBeenCalledWith({
      year: '2026',
      start_date: null,
      end_date: null,
      is_active: false,
      is_closed: false,
    });
  });

  it('maps duplicate year creation to a conflict', async () => {
    const query = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: '23505' } }),
    };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);

    await expect(AcademicYearService.createAcademicYear({ year: '2026' })).rejects.toMatchObject({
      message: 'Academic year already exists',
      status: 409,
    });
  });

  it('does not activate a closed academic year', async () => {
    const lookup = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'year-id', is_closed: true }, error: null }),
    };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(lookup) } as never);

    await expect(AcademicYearService.setActiveYear('year-id')).rejects.toMatchObject({
      message: 'Cannot activate a closed academic year',
      status: 409,
    });
  });

  it('rejects an update whose end date precedes its start date', async () => {
    const lookup = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: 'year-id', start_date: '2026-01-01', end_date: '2026-12-31' },
        error: null,
      }),
    };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(lookup) } as never);

    await expect(AcademicYearService.updateAcademicYear('year-id', { end_date: '2025-12-31' })).rejects.toMatchObject({
      message: 'End date must be on or after the start date',
      status: 400,
    });
  });

  it('blocks deletion when dependent records exist', async () => {
    const lookup = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'year-id', year: '2026', is_active: false }, error: null }),
    };
    const dependencyQuery = () => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ count: 1, error: null }),
    });
    const from = jest.fn()
      .mockReturnValueOnce(lookup)
      .mockImplementation(dependencyQuery);
    mockCreateClient.mockResolvedValue({ from } as never);

    await expect(AcademicYearService.deleteAcademicYear('year-id')).rejects.toMatchObject({
      message: 'Cannot delete an academic year with dependent records.',
      status: 409,
    });
  });
});
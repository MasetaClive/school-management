import { ClassService } from '../class.service';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('ClassService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a class after validating uniqueness and an open year', async () => {
    const unique = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const year = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'year-id', is_closed: false }, error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'class-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(unique).mockReturnValueOnce(year).mockReturnValueOnce(insert) } as never);

    await expect(ClassService.createClass({ name: 'Grade 1', grade_level: 1, academic_year: '2026' })).resolves.toEqual({ id: 'class-id' });
    expect(insert.insert).toHaveBeenCalledWith({ name: 'Grade 1', grade_level: 1, academic_year: '2026' });
  });

  it('rejects classes assigned to a closed academic year', async () => {
    const unique = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const year = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'year-id', is_closed: true }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(unique).mockReturnValueOnce(year) } as never);

    await expect(ClassService.createClass({ name: 'Grade 1', grade_level: 1, academic_year: '2026' })).rejects.toMatchObject({
      message: 'Cannot assign a class to a closed academic year',
      status: 409,
    });
  });

  it('rejects duplicate class names in the same year', async () => {
    const unique = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(unique) } as never);

    await expect(ClassService.createClass({ name: 'Grade 1', grade_level: 1, academic_year: '2026' })).rejects.toMatchObject({
      message: 'Class with this name already exists for the academic year',
      status: 400,
    });
  });

  it('blocks deletion when class dependencies exist', async () => {
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'class-id' }, error: null }) };
    const dependency = () => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ count: 1, error: null }) });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(lookup).mockImplementation(dependency) } as never);

    await expect(ClassService.deleteClass('class-id')).rejects.toMatchObject({
      message: 'Cannot delete class with dependent records.',
      status: 409,
    });
  });

  it('rejects missing years and lists filtered empty pages', async () => {
    const unique = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const missingYear = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(unique).mockReturnValueOnce(missingYear) } as never);
    await expect(ClassService.createClass({ name: 'Grade 1', grade_level: 1, academic_year: '2026' })).rejects.toMatchObject({ message: 'Academic year not found', status: 400 });

    const list = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), ilike: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: null, count: 0, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(list) } as never);
    await expect(ClassService.listClasses({ page: 2, search: 'Grade' })).resolves.toMatchObject({ data: [], page: 2, totalPages: 1 });
    expect(list.range).toHaveBeenCalledWith(20, 39);
  });

  it('maps class lookup and uniqueness errors', async () => {
    const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);
    await expect(ClassService.getClassById('id')).rejects.toMatchObject({ status: 500 });
    await expect(ClassService.ensureClassUnique('Name', '2026')).rejects.toMatchObject({ status: 500 });
  });
});
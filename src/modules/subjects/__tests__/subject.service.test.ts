import { SubjectService } from '../subject.service';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('SubjectService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('normalizes subject names and codes before inserting', async () => {
    const codeCheck = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const nameCheck = { select: jest.fn().mockReturnThis(), ilike: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'subject-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(codeCheck).mockReturnValueOnce(nameCheck).mockReturnValueOnce(insert) } as never);

    await expect(SubjectService.createSubject({ name: ' Mathematics ', code: ' mat ', description: '' })).resolves.toEqual({ id: 'subject-id' });
    expect(insert.insert).toHaveBeenCalledWith({ name: 'Mathematics', code: 'MAT', description: null });
  });

  it('rejects duplicate subject codes', async () => {
    const codeCheck = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }) };
    const nameCheck = { select: jest.fn().mockReturnThis(), ilike: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(codeCheck).mockReturnValueOnce(nameCheck) } as never);

    await expect(SubjectService.createSubject({ name: 'Math', code: 'MAT' })).rejects.toMatchObject({ message: 'Subject code already exists', status: 409 });
  });

  it('blocks deletion when subject dependencies exist', async () => {
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'subject-id' }, error: null }) };
    const dependency = () => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ count: 1, error: null }) });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(lookup).mockImplementation(dependency) } as never);

    await expect(SubjectService.deleteSubject('subject-id')).rejects.toMatchObject({ message: 'Cannot delete subject with dependent records.', status: 409 });
  });
});
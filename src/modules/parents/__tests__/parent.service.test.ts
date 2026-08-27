import { ParentService } from '../parent.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/modules/users/user.service', () => ({
  UserService: { provisionAccount: jest.fn(), rollbackProvisionedAccount: jest.fn() },
}));

import { createClient } from '@/lib/supabase/server';
import { UserService } from '@/modules/users/user.service';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('ParentService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a parent profile without an account and normalizes optional fields', async () => {
    const unique = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'parent-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(unique).mockReturnValueOnce(insert) } as never);

    await expect(ParentService.createParent({ parent_id: 'P001', full_name: 'Jane Doe', phone: '123', create_account: false, password_mode: 'auto' })).resolves.toEqual({ profile: { id: 'parent-id' }, account: null });
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ email: null, address: null, occupation: null, user_id: null }));
  });

  it('rolls back a provisioned account when parent insertion fails', async () => {
    const unique = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }) };
    jest.mocked(UserService.provisionAccount).mockResolvedValue({ userId: 'user-id', username: 'jane@example.com', initialPassword: 'secret' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(unique).mockReturnValueOnce(insert) } as never);

    await expect(ParentService.createParent({ parent_id: 'P001', full_name: 'Jane Doe', phone: '123', email: 'jane@example.com', create_account: true, password_mode: 'auto' })).rejects.toMatchObject({ status: 500 });
    expect(UserService.rollbackProvisionedAccount).toHaveBeenCalledWith('user-id');
  });

  it('blocks deletion when students are linked to the parent', async () => {
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'parent-id', user_id: null }, error: null }) };
    const linked = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ count: 1, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(linked) } as never);

    await expect(ParentService.deleteParent('parent-id')).rejects.toMatchObject({ message: 'Cannot delete parent with linked students', status: 409 });
  });
});
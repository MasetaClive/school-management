import { UserService } from '../user.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(), createAdminClient: jest.fn() }));

import { createAdminClient } from '@/lib/supabase/server';

const mockCreateAdminClient = createAdminClient as jest.MockedFunction<typeof createAdminClient>;

describe('UserService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('provisions an account with the supplied password and profile', async () => {
    const profileInsert = { insert: jest.fn().mockResolvedValue({ error: null }) };
    const adminClient = {
      auth: { admin: { createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null }), deleteUser: jest.fn() } },
      from: jest.fn().mockReturnValue(profileInsert),
    };
    mockCreateAdminClient.mockResolvedValue(adminClient as never);

    await expect(UserService.provisionAccount({ role: 'teacher', username: 'T001', fullName: 'Jane Doe', email: 'jane@example.com', password: 'Secret1!' })).resolves.toEqual({ userId: 'user-id', username: 'T001', initialPassword: 'Secret1!' });
    expect(adminClient.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: 'jane@example.com', password: 'Secret1!', email_confirm: true }));
    expect(profileInsert.insert).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-id', role: 'teacher' }));
  });

  it('throws when auth account creation fails', async () => {
    const createUser = jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Auth unavailable' } });
    mockCreateAdminClient.mockResolvedValue({ auth: { admin: { createUser } } } as never);

    await expect(UserService.provisionAccount({ role: 'student', username: 'S001', fullName: 'Student' })).rejects.toMatchObject({ message: 'Auth unavailable', status: 500 });
  });

  it('deletes the auth user when profile creation fails', async () => {
    const deleteUser = jest.fn().mockResolvedValue({});
    const adminClient = {
      auth: { admin: { createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null }), deleteUser } },
      from: jest.fn().mockReturnValue({ insert: jest.fn().mockResolvedValue({ error: { message: 'Profile failed' } }) }),
    };
    mockCreateAdminClient.mockResolvedValue(adminClient as never);

    await expect(UserService.provisionAccount({ role: 'parent', username: 'P001', fullName: 'Parent' })).rejects.toMatchObject({ message: 'Failed to create user profile: Profile failed', status: 500 });
    expect(deleteUser).toHaveBeenCalledWith('user-id');
  });

  it('uses a generated local password and rolls back both profile and auth account', async () => {
    const deleteUser = jest.fn().mockResolvedValue({});
    const profileInsert = { insert: jest.fn().mockResolvedValue({ error: null }) };
    const adminClient = { auth: { admin: { createUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null }), deleteUser } }, from: jest.fn().mockReturnValue(profileInsert) };
    mockCreateAdminClient.mockResolvedValue(adminClient as never);
    const result = await UserService.provisionAccount({ role: 'student', username: 'S001', fullName: 'Student' });
    expect(result.initialPassword).toEqual(expect.any(String));
    expect(adminClient.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: 's001@school.local', email_confirm: true }));

    const profileDelete = { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    const rollbackClient = { from: jest.fn().mockReturnValue(profileDelete), auth: { admin: { deleteUser } } };
    mockCreateAdminClient.mockResolvedValue(rollbackClient as never);
    await expect(UserService.rollbackProvisionedAccount('user-id')).resolves.toBeUndefined();
    expect(profileDelete.delete).toHaveBeenCalled();
    expect(deleteUser).toHaveBeenCalledWith('user-id');
  });

  it('lists users with optional filters and maps duplicate creation', async () => {
    const list = { select: jest.fn().mockReturnThis(), or: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), range: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }) };
    const client = { from: jest.fn().mockReturnValue(list) };
    const server = require('@/lib/supabase/server');
    server.createClient.mockResolvedValue(client);
    await expect(UserService.getUsers({ page: 2, search: 'Jane', role: 'teacher' })).resolves.toEqual({ data: [], total: 0, page: 2, limit: 10 });
    expect(list.range).toHaveBeenCalledWith(10, 19);

    const create = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { code: '23505' } }) };
    mockCreateAdminClient.mockResolvedValue({ from: jest.fn().mockReturnValue(create) } as never);
    await expect(UserService.createUser({ email: 'duplicate@example.com', full_name: 'Jane', role: 'teacher' } as never)).rejects.toMatchObject({ status: 409 });
  });
});
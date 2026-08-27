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
});
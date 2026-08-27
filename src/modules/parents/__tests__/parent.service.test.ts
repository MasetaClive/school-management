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

  it('covers parent lookup, update, list pagination, and dashboard branches', async () => {
    const missing = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(missing) } as never);
    await expect(ParentService.getParentById('missing')).rejects.toMatchObject({ status: 404 });

    const existing = { id: 'parent-id', full_name: 'Old', phone: '1', email: 'old@example.com', address: 'Old address', occupation: 'Teacher' };
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: existing, error: null }) };
    const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'parent-id', full_name: 'New' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(update) } as never);
    await expect(ParentService.updateParent('parent-id', { full_name: 'New', email: '' })).resolves.toEqual({ id: 'parent-id', full_name: 'New' });
    expect(update.update).toHaveBeenCalledWith(expect.objectContaining({ phone: '1', email: null, address: 'Old address', occupation: 'Teacher' }));

    const list = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), or: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(list) } as never);
    await expect(ParentService.listParents({ page: 2, search: 'Jane' })).resolves.toMatchObject({ data: [], page: 2, total: 0, totalPages: 1 });
    expect(list.range).toHaveBeenCalledWith(20, 39);

    const dashboardParent = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'parent-id' }, error: null }) };
    const children = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: null, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(dashboardParent).mockReturnValueOnce(children) } as never);
    await expect(ParentService.getDashboardData('user-id')).resolves.toEqual({ parent: { id: 'parent-id' }, children: [] });
  });

  it('maps parent validation and dependency failures', async () => {
    const validation = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(validation) } as never);
    await expect(ParentService.createParent({ parent_id: 'P001', full_name: 'Jane', phone: '0000000000', create_account: false, password_mode: 'auto' })).rejects.toMatchObject({ status: 500 });

    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'p', user_id: null }, error: null }) };
    const linkedFailure = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ count: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(linkedFailure) } as never);
    await expect(ParentService.deleteParent('p')).rejects.toMatchObject({ status: 500, message: 'Failed to check linked students' });
  });
});
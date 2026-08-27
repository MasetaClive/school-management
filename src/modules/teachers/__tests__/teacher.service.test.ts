import { TeacherService } from '../teacher.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/modules/users/user.service', () => ({ UserService: { provisionAccount: jest.fn(), rollbackProvisionedAccount: jest.fn() } }));
import { createClient } from '@/lib/supabase/server';
import { UserService } from '@/modules/users/user.service';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('TeacherService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a teacher profile without provisioning an account when disabled', async () => {
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'teacher-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(insert) } as never);

    await expect(TeacherService.createTeacher({ teacher_id: 'T001', full_name: 'Jane Doe', create_account: false, password_mode: 'auto' })).resolves.toEqual({ profile: { id: 'teacher-id' }, account: null });
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ teacher_id: 'T001', full_name: 'Jane Doe', user_id: null }));
  });

  it('rolls back a provisioned account when teacher insertion fails', async () => {
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }) };
    jest.mocked(UserService.provisionAccount).mockResolvedValue({ userId: 'user-id', username: 'T001', initialPassword: 'Secret1!' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(insert) } as never);

    await expect(TeacherService.createTeacher({ teacher_id: 'T001', full_name: 'Jane Doe', create_account: true, password_mode: 'auto' })).rejects.toMatchObject({ status: 500 });
    expect(UserService.rollbackProvisionedAccount).toHaveBeenCalledWith('user-id');
  });

  it('blocks deletion when the teacher has active assignments', async () => {
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'teacher-id', user_id: null }, error: null }) };
    const classAssignments = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ count: 1, error: null }) };
    const subjectAssignments = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ count: 0, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(classAssignments).mockReturnValueOnce(subjectAssignments) } as never);

    await expect(TeacherService.deleteTeacher('teacher-id')).rejects.toMatchObject({ message: 'Cannot delete teacher with active class or subject assignments.', status: 409 });
  });

  it('deletes an unassigned teacher and rolls back its linked account', async () => {
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'teacher-id', user_id: 'user-id' }, error: null }) };
    const check = () => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ count: 0, error: null }) });
    const remove = { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(lookup).mockImplementationOnce(check).mockImplementationOnce(check).mockReturnValueOnce(remove) } as never);

    await expect(TeacherService.deleteTeacher('teacher-id')).resolves.toEqual({ success: true });
    expect(UserService.rollbackProvisionedAccount).toHaveBeenCalledWith('user-id');
  });
});
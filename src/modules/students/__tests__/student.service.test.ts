import { StudentService, StudentServiceError } from '../student.service';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/modules/users/user.service', () => ({
  UserService: {
    provisionAccount: jest.fn(),
    rollbackProvisionedAccount: jest.fn(),
  },
}));

import { createClient } from '@/lib/supabase/server';
import { UserService } from '@/modules/users/user.service';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockUserService = UserService as jest.Mocked<typeof UserService>;

describe('StudentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureStudentIdUnique', () => {
    it('passes when the student ID does not exist', async () => {
      const maybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle,
      };

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue(query),
      } as never);

      await expect(
        StudentService.ensureStudentIdUnique('STU-001'),
      ).resolves.toBeUndefined();
    });

    it('throws when the student ID already exists', async () => {
      const maybeSingle = jest.fn().mockResolvedValue({
        data: { id: 'existing-id' },
        error: null,
      });

      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle,
      };

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue(query),
      } as never);

      await expect(
        StudentService.ensureStudentIdUnique('STU-001'),
      ).rejects.toMatchObject({
        message: 'Student ID already exists',
        status: 400,
      });
    });

    it('throws a server error when Supabase fails', async () => {
      const maybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const query = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle,
      };

      mockCreateClient.mockResolvedValue({
        from: jest.fn().mockReturnValue(query),
      } as never);

      await expect(
        StudentService.ensureStudentIdUnique('STU-001'),
      ).rejects.toMatchObject({
        message: 'Failed to validate student_id',
        status: 500,
      });
    });
  });

  describe('createStudent', () => {
    const baseInput = {
      student_id: 'STU-001',
      full_name: 'John Doe',
      academic_year: '2026',
      create_account: false,
      password_mode: 'auto' as const,
    };

    it('rejects a missing full name', async () => {
      await expect(
        StudentService.createStudent({
          ...baseInput,
          full_name: '',
        }),
      ).rejects.toMatchObject({
        message: 'Full name is required',
        status: 400,
      });
    });

    it('rejects a missing academic year', async () => {
      await expect(
        StudentService.createStudent({
          ...baseInput,
          academic_year: '',
        }),
      ).rejects.toMatchObject({
        message: 'Academic year is required',
        status: 400,
      });
    });

    it('creates a student successfully', async () => {
      const student = {
        id: 'student-id',
        student_id: 'STU-001',
        full_name: 'John Doe',
        academic_year: '2026',
      };

      const uniqueQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const insertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: student,
          error: null,
        }),
      };

      mockCreateClient
        .mockResolvedValueOnce({
          from: jest.fn().mockReturnValue(uniqueQuery),
        } as never)
        .mockResolvedValueOnce({
          from: jest.fn().mockReturnValue(insertQuery),
        } as never);

      await expect(
        StudentService.createStudent(baseInput),
      ).resolves.toEqual({
        profile: student,
        account: null,
      });

      expect(insertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: 'STU-001',
          full_name: 'John Doe',
          academic_year: '2026',
          user_id: null,
        }),
      );
    });

    it('validates optional class and parent references and normalizes medical info', async () => {
      const reference = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
      mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(reference) } as never);
      await expect(StudentService.createStudent({ ...baseInput, class_id: 'missing' })).rejects.toMatchObject({ message: 'Class not found' });
      const parentError = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
      mockCreateClient.mockResolvedValueOnce({ from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) }) } as never).mockResolvedValueOnce({ from: jest.fn().mockReturnValue(parentError) } as never);
      await expect(StudentService.createStudent({ ...baseInput, parent_id: 'missing' })).rejects.toMatchObject({ message: 'Parent not found' });
      expect(StudentService.normalizeMedicalInfo('{"allergy":"pollen"}')).toEqual({ allergy: 'pollen' });
      expect(StudentService.normalizeMedicalInfo('invalid')).toEqual({});
      expect(StudentService.normalizeMedicalInfo(12)).toEqual({});
    });

    it('provisions an account and rolls it back when student insertion fails', async () => {
      mockUserService.provisionAccount.mockResolvedValue({ userId: 'user-id', username: 'STU-001' } as never);
      const uniqueQuery = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
      const insertQuery = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }) };
      mockCreateClient.mockResolvedValueOnce({ from: jest.fn().mockReturnValue(uniqueQuery) } as never).mockResolvedValueOnce({ from: jest.fn().mockReturnValue(insertQuery) } as never);
      await expect(StudentService.createStudent({ ...baseInput, create_account: true, password: 'secret' })).rejects.toMatchObject({ message: 'Failed to create student: insert failed', status: 500 });
      expect(mockUserService.rollbackProvisionedAccount).toHaveBeenCalledWith('user-id');
    });
  });

  describe('updateStudent', () => {
    it('updates an existing student successfully', async () => {
      const existing = {
        id: 'student-id',
        full_name: 'Old Name',
        date_of_birth: null,
        gender: null,
        class_id: null,
        parent_id: null,
        guardian_name: null,
        guardian_phone: null,
        guardian_email: null,
        medical_info: {},
        admission_date: null,
        academic_year: '2026',
      };

      const updated = {
        ...existing,
        full_name: 'Updated Name',
      };

      const getQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: existing,
          error: null,
        }),
      };

      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: updated,
          error: null,
        }),
      };

      mockCreateClient
        .mockResolvedValueOnce({
          from: jest.fn().mockReturnValue(getQuery),
        } as never)
        .mockResolvedValueOnce({
          from: jest.fn().mockReturnValue(updateQuery),
        } as never);

      await expect(
        StudentService.updateStudent('student-id', {
          full_name: 'Updated Name',
        }),
      ).resolves.toEqual(updated);

      expect(updateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'Updated Name',
          academic_year: '2026',
        }),
      );
    });

    it('maps update and not-found errors', async () => {
      const missing = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
      mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(missing) } as never);
      await expect(StudentService.updateStudent('missing', {})).rejects.toMatchObject({ message: 'Student not found', status: 404 });
      const existing = { id: 'student-id', full_name: 'Name', class_id: null, parent_id: null, medical_info: {}, academic_year: '2026' };
      const get = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: existing, error: null }) };
      const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { message: 'down' } }) };
      mockCreateClient.mockResolvedValueOnce({ from: jest.fn().mockReturnValue(get) } as never).mockResolvedValueOnce({ from: jest.fn().mockReturnValue(update) } as never);
      await expect(StudentService.updateStudent('student-id', { medical_info: { asthma: true } })).rejects.toMatchObject({ message: 'Failed to update student', status: 500 });
    });
  });

  it('checks related records, deletes safely, and lists filtered students', async () => {
    const profile = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'student-id' }, error: null }) };
    const check = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ count: 0, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => profile).mockImplementation(() => check) } as never);
    await expect(StudentService.canHardDeleteStudent('student-id')).resolves.toBe(true);
    const list = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), or: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(list) } as never);
    await expect(StudentService.listStudents({ search: 'STU', class_id: 'class-id', academic_year: '2026', page: 2 })).resolves.toMatchObject({ data: [], page: 2, totalPages: 1 });
  });

  it('returns dashboard defaults and rejects a missing profile', async () => {
    const missing = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(missing) } as never);
    await expect(StudentService.getStudentDashboardData('user')).rejects.toMatchObject({ message: 'Student profile not found', status: 404 });
    const profile = { id: 'student-id', class_id: 'class-id', academic_year: '2026' };
    const profileQuery = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null }) };
    const attendance = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }) };
    const homework = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: null, count: null, error: null }) };
    const results = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const schedule = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
    schedule.eq.mockReturnValue(schedule);
    schedule.eq.mockImplementationOnce(() => schedule).mockImplementationOnce(() => schedule).mockResolvedValueOnce({ data: [], error: null });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => profileQuery).mockImplementationOnce(() => attendance).mockImplementationOnce(() => homework).mockImplementationOnce(() => results).mockImplementationOnce(() => schedule) } as never);
    await expect(StudentService.getStudentDashboardData('user')).resolves.toMatchObject({ stats: { attendanceRate: 100, pendingHomework: 0 }, recentResults: [], todaySchedule: [] });
  });
});

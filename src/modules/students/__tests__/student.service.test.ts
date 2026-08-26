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
  });
});

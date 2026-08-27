import { TeacherAttendanceService } from '../teacherAttendance.service';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('TeacherAttendanceService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('records attendance and normalizes empty remarks to null', async () => {
    const check = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'attendance-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(check).mockReturnValueOnce(insert) } as never);

    await expect(TeacherAttendanceService.createAttendance({ teacher_id: 'teacher-id', attendance_date: '2026-08-27', status: 'present', remarks: '' })).resolves.toEqual({ id: 'attendance-id' });
    expect(insert.insert).toHaveBeenCalledWith({ teacher_id: 'teacher-id', attendance_date: '2026-08-27', status: 'present', remarks: null });
  });

  it('rejects duplicate attendance for a teacher and date', async () => {
    const check = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(check) } as never);

    await expect(TeacherAttendanceService.createAttendance({ teacher_id: 'teacher-id', attendance_date: '2026-08-27', status: 'late' })).rejects.toMatchObject({
      message: 'Attendance already recorded for this teacher on this date',
      status: 409,
    });
  });

  it('maps an insert uniqueness race to a conflict', async () => {
    const check = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { code: '23505' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(check).mockReturnValueOnce(insert) } as never);

    await expect(TeacherAttendanceService.createAttendance({ teacher_id: 'teacher-id', attendance_date: '2026-08-27', status: 'absent' })).rejects.toMatchObject({ message: 'Attendance already recorded for this teacher on this date', status: 409 });
  });
});
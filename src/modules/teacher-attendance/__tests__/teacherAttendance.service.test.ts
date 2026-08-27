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

  it('maps check and insert failures', async () => {
    const check = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(check) } as never);
    await expect(TeacherAttendanceService.createAttendance({ teacher_id: 'teacher-id', attendance_date: '2026-08-27', status: 'present' })).rejects.toMatchObject({ status: 500, message: 'Failed to validate attendance' });
    const validCheck = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { code: 'XX000' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(validCheck).mockReturnValueOnce(insert) } as never);
    await expect(TeacherAttendanceService.createAttendance({ teacher_id: 'teacher-id', attendance_date: '2026-08-27', status: 'present' })).rejects.toMatchObject({ status: 500, message: 'Failed to record attendance' });
  });

  it('handles get, update, delete, and list failures', async () => {
    const get = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(get) } as never);
    await expect(TeacherAttendanceService.getAttendanceById('id')).rejects.toMatchObject({ status: 500 });
    const existing = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'id', teacher_id: 'teacher-id', attendance_date: '2026-08-27', status: 'present', remarks: null }, error: null }) };
    const conflict = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), neq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'other' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(existing).mockReturnValueOnce(conflict) } as never);
    await expect(TeacherAttendanceService.updateAttendance('id', { attendance_date: '2026-08-28' })).rejects.toMatchObject({ status: 409 });
    const request = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: null, count: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(request) } as never);
    await expect(TeacherAttendanceService.listAttendance({ teacher_id: 'teacher-id', date: '2026-08-27' })).rejects.toMatchObject({ status: 500 });
  });

  it('updates attendance without a date conflict and lists empty pages', async () => {
    const existing = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'id', teacher_id: 'teacher-id', attendance_date: '2026-08-27', status: 'present', remarks: null }, error: null }) };
    const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'id', status: 'late' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(existing).mockReturnValueOnce(update) } as never);
    await expect(TeacherAttendanceService.updateAttendance('id', { status: 'late' })).resolves.toEqual({ id: 'id', status: 'late' });
    expect(update.update).toHaveBeenCalledWith({ attendance_date: '2026-08-27', status: 'late', remarks: null });

    const list = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: null, count: 0, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(list) } as never);
    await expect(TeacherAttendanceService.listAttendance({ page: 2 })).resolves.toMatchObject({ data: [], page: 2, totalPages: 1 });
    expect(list.range).toHaveBeenCalledWith(20, 39);
  });

  it('maps missing records and delete or update database errors', async () => {
    const missing = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(missing) } as never);
    await expect(TeacherAttendanceService.getAttendanceById('missing')).rejects.toMatchObject({ status: 404 });
    const deletion = { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(deletion) } as never);
    await expect(TeacherAttendanceService.deleteAttendance('id')).rejects.toMatchObject({ status: 500 });
  });
});
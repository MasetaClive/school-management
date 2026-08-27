import { StudentAttendanceService } from '../studentAttendance.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const relation = (data: unknown, error: unknown = null) => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), neq: jest.fn().mockReturnThis(), or: jest.fn().mockResolvedValue({ data, error }), maybeSingle: jest.fn().mockResolvedValue({ data, error }) });
const input = { student_id: 'student-id', class_id: 'class-id', attendance_date: '2026-08-27', status: 'present' as const, recorded_by: null };

describe('StudentAttendanceService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('records attendance with null remarks and recorder when omitted', async () => {
    const refs = [relation({ id: 'student-id', class_id: 'class-id' }), relation({ id: 'class-id' })];
    const duplicate = relation(null);
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'attendance-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => refs[0]).mockImplementationOnce(() => refs[1]).mockImplementationOnce(() => duplicate).mockImplementationOnce(() => insert) } as never);

    await expect(StudentAttendanceService.createAttendance(input)).resolves.toEqual({ id: 'attendance-id' });
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ remarks: null, recorded_by: null }));
  });

  it('rejects attendance when the student is assigned to another class', async () => {
    const refs = [relation({ id: 'student-id', class_id: 'other-class' }), relation({ id: 'class-id' }), relation(null)];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => refs[0]).mockImplementationOnce(() => refs[1]).mockImplementationOnce(() => refs[2]) } as never);

    await expect(StudentAttendanceService.createAttendance(input)).rejects.toMatchObject({ message: 'Student is not assigned to the selected class', status: 409 });
  });

  it('rejects duplicate attendance for the same student and date', async () => {
    const refs = [relation({ id: 'student-id', class_id: 'class-id' }), relation({ id: 'class-id' })];
    const duplicate = relation({ id: 'existing-attendance' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => refs[0]).mockImplementationOnce(() => refs[1]).mockImplementationOnce(() => duplicate) } as never);

    await expect(StudentAttendanceService.createAttendance(input)).rejects.toMatchObject({ message: 'Attendance already recorded for this student on this date', status: 409 });
  });

  it('rejects an unknown recording teacher', async () => {
    const refs = [relation({ id: 'student-id', class_id: 'class-id' }), relation({ id: 'class-id' }), relation(null)];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => refs[0]).mockImplementationOnce(() => refs[1]).mockImplementationOnce(() => refs[2]) } as never);

    await expect(StudentAttendanceService.createAttendance({ ...input, recorded_by: 'teacher-id' })).rejects.toMatchObject({ message: 'Recording teacher not found', status: 404 });
  });

  it.each([
    ['student', [null, { id: 'class-id' }, null], 'Student not found'],
    ['class', [{ id: 'student-id', class_id: 'class-id' }, null, null], 'Class not found'],
  ])('rejects a missing %s reference', async (_name, values, message) => {
    const refs = values.map(value => relation(value));
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(refs[2]) } as never);
    await expect(StudentAttendanceService.createAttendance(input)).rejects.toMatchObject({ status: 404, message });
  });

  it('maps reference, duplicate, and insert database errors', async () => {
    const refs = [relation({ id: 'student-id', class_id: 'class-id' }, { message: 'db' }), relation({ id: 'class-id' }), relation(null)];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(refs[2]) } as never);
    await expect(StudentAttendanceService.createAttendance(input)).rejects.toMatchObject({ status: 500, message: 'Failed to validate attendance references' });

    const valid = [relation({ id: 'student-id', class_id: 'class-id' }), relation({ id: 'class-id' })];
    const duplicate = relation(null, { message: 'db' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(valid[0]).mockReturnValueOnce(valid[1]).mockReturnValueOnce(duplicate) } as never);
    await expect(StudentAttendanceService.createAttendance(input)).rejects.toMatchObject({ status: 500, message: 'Failed to validate attendance' });

    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { code: '23505' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(valid[0]).mockReturnValueOnce(valid[1]).mockReturnValueOnce(relation(null)).mockReturnValueOnce(insert) } as never);
    await expect(StudentAttendanceService.createAttendance(input)).rejects.toMatchObject({ status: 409 });
  });

  it('gets, updates, deletes, and lists attendance records', async () => {
    const missing = relation(null);
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(missing) } as never);
    await expect(StudentAttendanceService.getAttendanceById('missing')).rejects.toMatchObject({ status: 404 });

    const existing = relation({ id: 'attendance-id', student_id: 'student-id', class_id: 'class-id', attendance_date: '2026-08-27', status: 'present', recorded_by: null, remarks: null });
    const refs = [relation({ id: 'student-id', class_id: 'class-id' }), relation({ id: 'class-id' })];
    const unique = relation(null);
    const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'attendance-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(existing).mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(unique).mockReturnValueOnce(update) } as never);
    await expect(StudentAttendanceService.updateAttendance('attendance-id', { remarks: '' })).resolves.toEqual({ id: 'attendance-id' });

    const found = relation({ id: 'attendance-id' });
    const remove = { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(found).mockReturnValueOnce(remove) } as never);
    await expect(StudentAttendanceService.deleteAttendance('attendance-id')).resolves.toEqual({ success: true });

    const request = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), or: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(request).mockReturnValueOnce(relation([{ id: 'student-id' }])).mockReturnValueOnce(relation([{ id: 'class-id' }])) } as never);
    await expect(StudentAttendanceService.listAttendance({ status: 'present', search: 'Ada' })).resolves.toMatchObject({ data: [], total: 0, totalPages: 1 });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(request) } as never);
    await expect(StudentAttendanceService.listAttendance({ search: '%,_()' })).resolves.toMatchObject({ data: [], total: 0 });
  });
});
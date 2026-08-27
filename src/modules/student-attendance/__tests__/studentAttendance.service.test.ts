import { StudentAttendanceService } from '../studentAttendance.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const relation = (data: unknown, error: unknown = null) => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data, error }) });
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
});
import { ClassTeacherService } from '../classTeacher.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const relation = (data: unknown, error: unknown = null) => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data, error }) });
const input = { class_id: 'class-id', teacher_id: 'teacher-id', is_homeroom: true, academic_year: '2026' };

describe('ClassTeacherService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a homeroom assignment when references and exclusivity checks pass', async () => {
    const references = [relation({ id: 'class-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: false })];
    const checks = [relation(null), relation(null), relation(null)];
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'assignment-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => references[0]).mockImplementationOnce(() => references[1]).mockImplementationOnce(() => references[2]).mockImplementationOnce(() => checks[0]).mockImplementationOnce(() => checks[1]).mockImplementationOnce(() => checks[2]).mockImplementationOnce(() => insert) } as never);

    await expect(ClassTeacherService.createClassTeacher(input)).resolves.toEqual({ id: 'assignment-id' });
    expect(insert.insert).toHaveBeenCalledWith(input);
  });

  it('rejects assignment to a closed academic year', async () => {
    const references = [relation({ id: 'class-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: true })];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementation((table: string) => references[['classes', 'teachers', 'academic_years'].indexOf(table)]) } as never);

    await expect(ClassTeacherService.createClassTeacher(input)).rejects.toMatchObject({ message: 'Cannot assign a class teacher to a closed academic year', status: 409 });
  });

  it('rejects when the class already has an active homeroom teacher', async () => {
    const references = [relation({ id: 'class-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: false })];
    const checks = [relation(null), relation({ id: 'existing-homeroom' }), relation(null)];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => references[0]).mockImplementationOnce(() => references[1]).mockImplementationOnce(() => references[2]).mockImplementationOnce(() => checks[0]).mockImplementationOnce(() => checks[1]).mockImplementationOnce(() => checks[2]) } as never);

    await expect(ClassTeacherService.createClassTeacher(input)).rejects.toMatchObject({ message: 'This class already has an active class teacher for the selected academic year', status: 409 });
  });

  it('rejects duplicate teacher assignment to the same class and year', async () => {
    const references = [relation({ id: 'class-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: false })];
    const checks = [relation({ id: 'existing-assignment' }), relation(null), relation(null)];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => references[0]).mockImplementationOnce(() => references[1]).mockImplementationOnce(() => references[2]).mockImplementationOnce(() => checks[0]).mockImplementationOnce(() => checks[1]).mockImplementationOnce(() => checks[2]) } as never);

    await expect(ClassTeacherService.createClassTeacher(input)).rejects.toMatchObject({ message: 'Teacher is already assigned to this class for the selected academic year', status: 409 });
  });
});
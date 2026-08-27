import { ClassTeacherService } from '../classTeacher.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const relation = (data: unknown, error: unknown = null) => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), neq: jest.fn().mockReturnThis(), or: jest.fn().mockResolvedValue({ data, error }), maybeSingle: jest.fn().mockResolvedValue({ data, error }) });
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

  it.each([
    ['class', [null, { id: 'teacher-id' }, { id: 'year-id', is_closed: false }], 'Class not found'],
    ['teacher', [{ id: 'class-id' }, null, { id: 'year-id', is_closed: false }], 'Teacher not found'],
    ['academic year', [{ id: 'class-id' }, { id: 'teacher-id' }, null], 'Academic year not found'],
  ])('rejects a missing %s reference', async (_name, values, message) => {
    const refs = values.map(value => relation(value));
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(refs[2]) } as never);
    await expect(ClassTeacherService.createClassTeacher(input)).rejects.toMatchObject({ status: 404, message });
  });

  it('rejects reference and homeroom validation errors', async () => {
    const refs = [relation({ id: 'class-id' }, { message: 'db' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: false })];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(refs[2]) } as never);
    await expect(ClassTeacherService.createClassTeacher(input)).rejects.toMatchObject({ status: 500 });
    const valid = [relation({ id: 'class-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: false })];
    const checks = [relation(null), relation(null), relation({ id: 'other-class' })];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(valid[0]).mockReturnValueOnce(valid[1]).mockReturnValueOnce(valid[2]).mockReturnValueOnce(checks[0]).mockReturnValueOnce(checks[1]).mockReturnValueOnce(checks[2]) } as never);
    await expect(ClassTeacherService.createClassTeacher(input)).rejects.toMatchObject({ status: 409, message: 'This teacher is already the active class teacher for another class in the selected academic year' });
  });

  it('maps insert conflicts and supports list and delete not-found paths', async () => {
    const refs = [relation({ id: 'class-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: false })];
    const checks = [relation(null), relation(null), relation(null)];
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { code: '23505' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(refs[2]).mockReturnValueOnce(checks[0]).mockReturnValueOnce(checks[1]).mockReturnValueOnce(checks[2]).mockReturnValueOnce(insert) } as never);
    await expect(ClassTeacherService.createClassTeacher(input)).rejects.toMatchObject({ status: 409 });
    const request = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), or: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(request).mockReturnValueOnce(relation([{ id: 'teacher-id' }])).mockReturnValueOnce(relation([{ id: 'class-id' }])) } as never);
    await expect(ClassTeacherService.getClassTeachers({ search: 'Ada', page: 2 })).resolves.toMatchObject({ page: 2, total: 0 });
    const missing = relation(null);
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(missing) } as never);
    await expect(ClassTeacherService.deleteClassTeacher('missing')).rejects.toMatchObject({ status: 404 });
  });
});
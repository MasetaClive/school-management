import { SubjectAssignmentService } from '../subjectAssignment.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const relation = (data: unknown, error: unknown = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  or: jest.fn().mockResolvedValue({ data, error }),
  maybeSingle: jest.fn().mockResolvedValue({ data, error }),
});
describe('SubjectAssignmentService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('creates an assignment after reference and duplicate checks pass', async () => {
    const refs = [relation({ id: 'teacher-id' }), relation({ id: 'subject-id' }), relation({ id: 'class-id' })];
    const duplicate = relation(null);
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'assignment-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(refs[2]).mockReturnValueOnce(duplicate).mockReturnValueOnce(insert) } as never);
    await expect(SubjectAssignmentService.createSubjectAssignment({ teacher_id: 'teacher-id', subject_id: 'subject-id', class_id: 'class-id', academic_year: '2026' })).resolves.toEqual({ id: 'assignment-id' });
  });
  it('rejects an existing assignment', async () => {
    const refs = [relation({ id: 'teacher-id' }), relation({ id: 'subject-id' }), relation({ id: 'class-id' })];
    const duplicate = relation({ id: 'existing' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(refs[2]).mockReturnValueOnce(duplicate) } as never);
    await expect(SubjectAssignmentService.createSubjectAssignment({ teacher_id: 'teacher-id', subject_id: 'subject-id', class_id: 'class-id', academic_year: '2026' })).rejects.toMatchObject({ status: 409, message: 'This subject is already assigned to this teacher in this class for the given year' });
  });

  it.each([
    ['teacher', [null, { id: 'subject-id' }, { id: 'class-id' }], 'Teacher not found'],
    ['subject', [{ id: 'teacher-id' }, null, { id: 'class-id' }], 'Subject not found'],
    ['class', [{ id: 'teacher-id' }, { id: 'subject-id' }, null], 'Class not found'],
  ])('rejects when the %s reference is missing', async (_name, values, message) => {
    const refs = values.map(value => relation(value));
    mockCreateClient.mockResolvedValue({ from: jest.fn()
      .mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(refs[2]) } as never);

    await expect(SubjectAssignmentService.createSubjectAssignment({ teacher_id: 'teacher-id', subject_id: 'subject-id', class_id: 'class-id', academic_year: '2026' }))
      .rejects.toMatchObject({ status: 404, message });
  });

  it('maps reference and duplicate lookup errors to server errors', async () => {
    const refs = [relation({ id: 'teacher-id' }, { message: 'db' }), relation({ id: 'subject-id' }), relation({ id: 'class-id' })];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(refs[2]) } as never);
    await expect(SubjectAssignmentService.createSubjectAssignment({ teacher_id: 'teacher-id', subject_id: 'subject-id', class_id: 'class-id', academic_year: '2026' }))
      .rejects.toMatchObject({ status: 500, message: 'Failed to validate assignment references' });

    const validRefs = [relation({ id: 'teacher-id' }), relation({ id: 'subject-id' }), relation({ id: 'class-id' })];
    const duplicate = relation(null, { message: 'db' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(validRefs[0]).mockReturnValueOnce(validRefs[1]).mockReturnValueOnce(validRefs[2]).mockReturnValueOnce(duplicate) } as never);
    await expect(SubjectAssignmentService.createSubjectAssignment({ teacher_id: 'teacher-id', subject_id: 'subject-id', class_id: 'class-id', academic_year: '2026' }))
      .rejects.toMatchObject({ status: 500, message: 'Failed to validate assignment uniqueness' });
  });

  it.each([
    [{ code: '23505' }, 409, 'This assignment already exists'],
    [{ code: 'XX000' }, 500, 'Failed to create assignment'],
  ])('maps insert errors', async (error, status, message) => {
    const refs = [relation({ id: 'teacher-id' }), relation({ id: 'subject-id' }), relation({ id: 'class-id' })];
    const duplicate = relation(null);
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(refs[2]).mockReturnValueOnce(duplicate).mockReturnValueOnce(insert) } as never);
    await expect(SubjectAssignmentService.createSubjectAssignment({ teacher_id: 'teacher-id', subject_id: 'subject-id', class_id: 'class-id', academic_year: '2026' }))
      .rejects.toMatchObject({ status, message });
  });

  it('handles lookup, update, and delete outcomes', async () => {
    const lookup = relation(null);
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(lookup) } as never);
    await expect(SubjectAssignmentService.getSubjectAssignmentById('missing')).rejects.toMatchObject({ status: 404 });

    const existing = relation({ id: 'assignment-id', teacher_id: 'teacher-id', subject_id: 'subject-id', class_id: 'class-id', academic_year: '2026' });
    const refs = [relation({ id: 'teacher-id' }), relation({ id: 'subject-id' }), relation({ id: 'class-id' })];
    const duplicate = relation(null);
    const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'assignment-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(existing).mockReturnValueOnce(refs[0]).mockReturnValueOnce(refs[1]).mockReturnValueOnce(refs[2]).mockReturnValueOnce(duplicate).mockReturnValueOnce(update) } as never);
    await expect(SubjectAssignmentService.updateSubjectAssignment('assignment-id', { academic_year: '2027' })).resolves.toEqual({ id: 'assignment-id' });

    const found = relation({ id: 'assignment-id' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(found).mockReturnValueOnce({ delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) }) } as never);
    await expect(SubjectAssignmentService.deleteSubjectAssignment('assignment-id')).resolves.toEqual({ success: true });
  });

  it('lists filtered assignments, returns sanitized empty searches, and reports query errors', async () => {
    const request = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), or: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: [{ id: 'a' }], count: 21, error: null }) };
    const searchRelations = [relation([{ id: 'teacher-id' }]), relation([{ id: 'subject-id' }]), relation([{ id: 'class-id' }])];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(request).mockReturnValueOnce(searchRelations[0]).mockReturnValueOnce(searchRelations[1]).mockReturnValueOnce(searchRelations[2]) } as never);
    await expect(SubjectAssignmentService.listSubjectAssignments({ page: 2, teacher_id: 'teacher-id', class_id: 'class-id', subject_id: 'subject-id', search: 'Ada' }))
      .resolves.toMatchObject({ data: [{ id: 'a' }], page: 2, total: 21, totalPages: 2 });
    expect(request.range).toHaveBeenCalledWith(20, 39);

    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(request) } as never);
    await expect(SubjectAssignmentService.listSubjectAssignments({ search: '%,_()' })).resolves.toEqual({ data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 });

    const failedRequest = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: null, count: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(failedRequest) } as never);
    await expect(SubjectAssignmentService.listSubjectAssignments({})).rejects.toMatchObject({ status: 500, message: 'Failed to fetch assignments' });
  });
});
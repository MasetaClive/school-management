import { SubjectAssignmentService } from '../subjectAssignment.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const relation = (data: unknown) => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data, error: null }) });
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
});
import { FeesService } from '../fees/fees.service';
import { SubjectService } from '../subjects/subject.service';
import { NotificationService } from '../notifications/notification.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('low coverage services', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists fee types with and without an academic year', async () => {
    const request = { eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), then: (resolve: (value: unknown) => unknown) => resolve({ data: [{ id: 'fee-type-1' }], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue(request) }) } as never);
    await expect(FeesService.listFeeTypes('2026')).resolves.toEqual([{ id: 'fee-type-1' }]);
    await expect(FeesService.listFeeTypes()).resolves.toEqual([{ id: 'fee-type-1' }]);
    expect(request.eq).toHaveBeenCalledWith('academic_year', '2026');
  });

  it('maps fee creation, assignment, and balance failures', async () => {
    const failed = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: new Error('db') }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(failed) } as never);
    await expect(FeesService.createFeeType({ name: 'Tuition', academic_year: '2026' })).rejects.toMatchObject({ status: 500 });
    await expect(FeesService.assignFeeToStudent({ student_id: 'student-1', fee_type_id: 'fee-type-1', total_amount: 100, academic_year: '2026' })).rejects.toMatchObject({ status: 500 });
    const balance = { eq: jest.fn().mockResolvedValue({ data: null, error: new Error('db') }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue(balance) }) } as never);
    await expect(FeesService.getStudentBalances('student-1')).rejects.toMatchObject({ status: 500 });
  });

  it('gets and updates subjects while handling dependency-free deletion', async () => {
    const lookup = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'subject-1', name: 'Math', code: 'MAT', description: null }, error: null }) };
    const code = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), neq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const name = { select: jest.fn().mockReturnThis(), ilike: jest.fn().mockReturnThis(), neq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'subject-1', code: 'SCI' }, error: null }) };
    const dependency = () => ({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ count: 0, error: null }) });
    const deletion = { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    const subjectFrom = jest.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(lookup).mockReturnValueOnce(code).mockReturnValueOnce(name).mockReturnValueOnce(update).mockReturnValueOnce(lookup)
      .mockImplementationOnce(dependency).mockImplementationOnce(dependency).mockImplementationOnce(dependency).mockImplementationOnce(dependency).mockReturnValueOnce(deletion);
    mockCreateClient.mockResolvedValue({ from: subjectFrom } as never);
    await expect(SubjectService.getSubjectById('subject-1')).resolves.toMatchObject({ id: 'subject-1' });
    await expect(SubjectService.updateSubject('subject-1', { code: 'sci' })).resolves.toEqual({ id: 'subject-1', code: 'SCI' });
    await expect(SubjectService.deleteSubject('subject-1')).resolves.toEqual({ success: true });
  });

  it('lists subjects and maps lookup and duplicate errors', async () => {
    const list = { select: jest.fn(), order: jest.fn(), or: jest.fn(), range: jest.fn().mockResolvedValue({ data: [{ id: 'subject-1' }], count: 1, error: null }) };
    list.select.mockReturnValue(list);
    list.order.mockReturnValue(list);
    list.or.mockReturnValue(list);
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(list) } as never);
    await expect(SubjectService.listSubjects({ page: 2, search: 'math' })).resolves.toMatchObject({ page: 2, total: 1, totalPages: 1 });
    const duplicateCode = { maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }) };
    const duplicateName = { maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: duplicateCode.maybeSingle }).mockReturnValueOnce({ select: jest.fn().mockReturnThis(), ilike: jest.fn().mockReturnThis(), maybeSingle: duplicateName.maybeSingle }) } as never);
    await expect(SubjectService.ensureSubjectUnique('Math', 'MAT')).rejects.toMatchObject({ status: 409 });
  });

  it('lists notifications and maps database failures', async () => {
    const query = { eq: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [{ id: 'notification-1' }], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue(query) }) } as never);
    await expect(NotificationService.listForUser('parent@example.com')).resolves.toEqual([{ id: 'notification-1' }]);
    query.order.mockResolvedValue({ data: null, error: new Error('db') });
    await expect(NotificationService.listForUser('parent@example.com')).rejects.toMatchObject({ status: 500 });
  });
});
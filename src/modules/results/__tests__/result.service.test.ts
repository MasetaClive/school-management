import { ResultService } from '../result.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const relationshipQuery = (data: unknown, error: unknown = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockResolvedValue({ data, error }),
  ilike: jest.fn().mockResolvedValue({ data, error }),
  maybeSingle: jest.fn().mockResolvedValue({ data, error }),
});

describe('ResultService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('records a result with the calculated grade', async () => {
    const exam = relationshipQuery({ id: 'exam-id', max_marks: 100, class_id: 'class-id', academic_year: '2026' });
    const student = relationshipQuery({ id: 'student-id', class_id: 'class-id', academic_year: '2026' });
    const uniqueness = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'result-id', grade: 'A' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(exam).mockReturnValueOnce(student).mockReturnValueOnce(uniqueness).mockReturnValueOnce(insert) } as never);

    await expect(ResultService.createResult({ exam_id: 'exam-id', student_id: 'student-id', marks_obtained: 85 })).resolves.toEqual({ id: 'result-id', grade: 'A' });
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ marks_obtained: 85, grade: 'A', remarks: null }));
  });

  it('rejects a student who is not eligible for the exam class and year', async () => {
    const exam = relationshipQuery({ id: 'exam-id', max_marks: 100, class_id: 'class-a', academic_year: '2026' });
    const student = relationshipQuery({ id: 'student-id', class_id: 'class-b', academic_year: '2026' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(exam).mockReturnValueOnce(student) } as never);

    await expect(ResultService.createResult({ exam_id: 'exam-id', student_id: 'student-id', marks_obtained: 50 })).rejects.toMatchObject({ message: 'Student is not eligible for this exam', status: 409 });
  });

  it('rejects marks above the exam maximum', async () => {
    const exam = relationshipQuery({ id: 'exam-id', max_marks: 100, class_id: 'class-id', academic_year: '2026' });
    const student = relationshipQuery({ id: 'student-id', class_id: 'class-id', academic_year: '2026' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(exam).mockReturnValueOnce(student) } as never);

    await expect(ResultService.createResult({ exam_id: 'exam-id', student_id: 'student-id', marks_obtained: 101 })).rejects.toMatchObject({ message: 'Marks obtained (101) cannot exceed maximum marks (100)', status: 400 });
  });

  it('rejects a duplicate result', async () => {
    const exam = relationshipQuery({ id: 'exam-id', max_marks: 100, class_id: 'class-id', academic_year: '2026' });
    const student = relationshipQuery({ id: 'student-id', class_id: 'class-id', academic_year: '2026' });
    const uniqueness = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(exam).mockReturnValueOnce(student).mockReturnValueOnce(uniqueness) } as never);

    await expect(ResultService.createResult({ exam_id: 'exam-id', student_id: 'student-id', marks_obtained: 50 })).rejects.toMatchObject({ message: 'Result already exists for this student in this exam', status: 409 });
  });

  it.each([
    ['exam', [null, { id: 'student-id', class_id: 'class-id', academic_year: '2026' }], 'Exam not found'],
    ['student', [{ id: 'exam-id', max_marks: 100, class_id: 'class-id', academic_year: '2026' }, null], 'Student not found'],
  ])('rejects a missing %s relationship', async (_name, values, message) => {
    const queries = values.map(value => relationshipQuery(value));
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(queries[0]).mockReturnValueOnce(queries[1]) } as never);
    await expect(ResultService.createResult({ exam_id: 'exam-id', student_id: 'student-id', marks_obtained: 50 })).rejects.toMatchObject({ status: 404, message });
  });

  it('maps relationship, uniqueness, and insert database errors', async () => {
    const exam = relationshipQuery({ id: 'exam-id', max_marks: 100, class_id: 'class-id', academic_year: '2026' }, { message: 'db' });
    const student = relationshipQuery({ id: 'student-id', class_id: 'class-id', academic_year: '2026' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(exam).mockReturnValueOnce(student) } as never);
    await expect(ResultService.createResult({ exam_id: 'exam-id', student_id: 'student-id', marks_obtained: 50 })).rejects.toMatchObject({ status: 500, message: 'Failed to validate result relationships' });
    const validExam = relationshipQuery({ id: 'exam-id', max_marks: 100, class_id: 'class-id', academic_year: '2026' });
    const validStudent = relationshipQuery({ id: 'student-id', class_id: 'class-id', academic_year: '2026' });
    const uniqueness = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(validExam).mockReturnValueOnce(validStudent).mockReturnValueOnce(uniqueness) } as never);
    await expect(ResultService.createResult({ exam_id: 'exam-id', student_id: 'student-id', marks_obtained: 50 })).rejects.toMatchObject({ status: 500, message: 'Failed to validate result uniqueness' });
  });

  it.each([
    [80, 'A'], [70, 'B'], [60, 'C'], [50, 'D'], [49, 'F'],
  ])('calculates grade %s as %s', async (marks, grade) => {
    const exam = relationshipQuery({ id: 'exam-id', max_marks: 100, class_id: 'class-id', academic_year: '2026' });
    const student = relationshipQuery({ id: 'student-id', class_id: 'class-id', academic_year: '2026' });
    const uniqueness = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { grade }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(exam).mockReturnValueOnce(student).mockReturnValueOnce(uniqueness).mockReturnValueOnce(insert) } as never);
    await expect(ResultService.createResult({ exam_id: 'exam-id', student_id: 'student-id', marks_obtained: marks })).resolves.toEqual({ grade });
  });

  it('handles get, update, delete, and list branches', async () => {
    const missing = relationshipQuery(null);
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(missing) } as never);
    await expect(ResultService.getResultById('missing')).rejects.toMatchObject({ status: 404 });
    const existing = relationshipQuery({ id: 'result-id', exam_id: 'exam-id', student_id: 'student-id', marks_obtained: 50, remarks: null });
    const exam = relationshipQuery({ id: 'exam-id', max_marks: 100, class_id: 'class-id', academic_year: '2026' });
    const student = relationshipQuery({ id: 'student-id', class_id: 'class-id', academic_year: '2026' });
    const update = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'result-id', grade: 'B' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(existing).mockReturnValueOnce(exam).mockReturnValueOnce(student).mockReturnValueOnce(update) } as never);
    await expect(ResultService.updateResult('result-id', { marks_obtained: 75, remarks: '' })).resolves.toEqual({ id: 'result-id', grade: 'B' });
    const found = relationshipQuery({ id: 'result-id' });
    const remove = { delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(found).mockReturnValueOnce(remove) } as never);
    await expect(ResultService.deleteResult('result-id')).resolves.toEqual({ success: true });
    const request = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), or: jest.fn().mockReturnThis(), range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(request).mockReturnValueOnce(relationshipQuery([{ id: 'student-id' }])).mockReturnValueOnce(relationshipQuery([{ id: 'exam-id' }])) } as never);
    await expect(ResultService.listResults({ search: 'Ada' })).resolves.toMatchObject({ data: [], total: 0 });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(request) } as never);
    await expect(ResultService.listResults({ search: '%,_()' })).resolves.toMatchObject({ data: [], total: 0 });
  });
});
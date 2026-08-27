import { ResultService } from '../result.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));

import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const relationshipQuery = (data: unknown, error: unknown = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
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
});
import { ExamService } from '../exam.service';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const relation = (data: unknown, error: unknown = null) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
  delete: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data, error }),
});
const validInput = {
  name: 'Midterm', class_id: 'class-id', subject_id: 'subject-id', teacher_id: 'teacher-id',
  exam_type: 'midterm' as const, exam_date: '2026-06-15', max_marks: 100, academic_year: '2026',
};

describe('ExamService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates an exam after relationship and conflict checks pass', async () => {
    const relationships = [relation({ id: 'class-id' }), relation({ id: 'subject-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', start_date: '2026-01-01', end_date: '2026-12-31', is_closed: false }), relation({ id: 'assignment-id' }), relation({ id: 'timetable-id' })];
    const conflict = relation(null);
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'exam-id' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => relationships[0]).mockImplementationOnce(() => relationships[1]).mockImplementationOnce(() => relationships[2]).mockImplementationOnce(() => relationships[3]).mockImplementationOnce(() => relationships[4]).mockImplementationOnce(() => relationships[5]).mockImplementationOnce(() => conflict).mockImplementationOnce(() => insert) } as never);

    await expect(ExamService.createExam(validInput)).resolves.toEqual({ id: 'exam-id' });
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ name: 'Midterm', max_marks: 100 }));
  });

  it('rejects exams in a closed academic year', async () => {
    const relationships = [relation({ id: 'class-id' }), relation({ id: 'subject-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: true }), relation({ id: 'assignment-id' }), relation({ id: 'timetable-id' })];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementation((table: string) => relationships[['classes', 'subjects', 'teachers', 'academic_years', 'subject_assignments', 'timetable_entries'].indexOf(table)]) } as never);

    await expect(ExamService.createExam(validInput)).rejects.toMatchObject({ message: 'Cannot schedule an exam in a closed academic year', status: 409 });
  });

  it('rejects an exam when the student-facing relationship is missing', async () => {
    const relationships = [relation({ id: 'class-id' }), relation({ id: 'subject-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: false }), relation(null), relation({ id: 'timetable-id' })];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementation((table: string) => relationships[['classes', 'subjects', 'teachers', 'academic_years', 'subject_assignments', 'timetable_entries'].indexOf(table)]) } as never);

    await expect(ExamService.createExam(validInput)).rejects.toMatchObject({ message: 'A matching subject assignment is required for this exam', status: 409 });
  });

  it('rejects a duplicate exam for the same class, subject, and date', async () => {
    const relationships = [relation({ id: 'class-id' }), relation({ id: 'subject-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: false }), relation({ id: 'assignment-id' }), relation({ id: 'timetable-id' })];
    const conflict = relation({ id: 'existing-exam' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => relationships[0]).mockImplementationOnce(() => relationships[1]).mockImplementationOnce(() => relationships[2]).mockImplementationOnce(() => relationships[3]).mockImplementationOnce(() => relationships[4]).mockImplementationOnce(() => relationships[5]).mockImplementationOnce(() => conflict) } as never);

    await expect(ExamService.createExam(validInput)).rejects.toMatchObject({ message: 'This class already has an exam for this subject on the selected date', status: 409 });
  });

  it.each([
    ['class', 0, 'Class not found', 404], ['subject', 1, 'Subject not found', 404], ['teacher', 2, 'Teacher not found', 404],
    ['year', 3, 'Academic year not found', 404], ['assignment', 4, 'A matching subject assignment is required for this exam', 409], ['timetable', 5, 'A matching timetable entry is required for this exam', 409],
  ])('rejects a missing %s relationship', async (_name, index, message, status) => {
    const relationships = [relation({ id: 'class-id' }), relation({ id: 'subject-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: false }), relation({ id: 'assignment-id' }), relation({ id: 'timetable-id' })];
    relationships[index as number] = relation(null);
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementation((table: string) => relationships[['classes', 'subjects', 'teachers', 'academic_years', 'subject_assignments', 'timetable_entries'].indexOf(table)]) } as never);
    await expect(ExamService.createExam(validInput)).rejects.toMatchObject({ message, status });
  });

  it.each(['2025-12-31', '2027-01-01'])('rejects an exam date outside the year: %s', async (examDate) => {
    const relationships = [relation({ id: 'class-id' }), relation({ id: 'subject-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', start_date: '2026-01-01', end_date: '2026-12-31', is_closed: false }), relation({ id: 'assignment-id' }), relation({ id: 'timetable-id' })];
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementation((table: string) => relationships[['classes', 'subjects', 'teachers', 'academic_years', 'subject_assignments', 'timetable_entries'].indexOf(table)]) } as never);
    await expect(ExamService.createExam({ ...validInput, exam_date: examDate })).rejects.toMatchObject({ message: 'Exam date must fall within the academic year', status: 400 });
  });

  it('maps create, fetch, and list errors', async () => {
    const relationships = [relation({ id: 'class-id' }), relation({ id: 'subject-id' }), relation({ id: 'teacher-id' }), relation({ id: 'year-id', is_closed: false }), relation({ id: 'assignment-id' }), relation({ id: 'timetable-id' })];
    const insert = { insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockImplementationOnce(() => relationships[0]).mockImplementationOnce(() => relationships[1]).mockImplementationOnce(() => relationships[2]).mockImplementationOnce(() => relationships[3]).mockImplementationOnce(() => relationships[4]).mockImplementationOnce(() => relationships[5]).mockImplementationOnce(() => relation(null)).mockImplementationOnce(() => insert) } as never);
    await expect(ExamService.createExam(validInput)).rejects.toMatchObject({ status: 409, message: 'duplicate' });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(relation(null)) } as never);
    await expect(ExamService.getExamById('missing')).rejects.toMatchObject({ status: 404 });
    const list = relation(null, { message: 'down' });
    list.range.mockResolvedValue({ data: null, error: { message: 'down' }, count: 0 });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(list) } as never);
    await expect(ExamService.listExams({})).rejects.toMatchObject({ status: 500 });
  });
});
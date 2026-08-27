import { ReportCardService } from '../reportCard.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
describe('ReportCardService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('calculates letter-grade boundaries', () => {
    expect(ReportCardService.getLetterGrade(80)).toBe('A');
    expect(ReportCardService.getLetterGrade(50)).toBe('D');
    expect(ReportCardService.getLetterGrade(39)).toBe('F');
    expect(ReportCardService.getLetterGrade(70)).toBe('B');
    expect(ReportCardService.getLetterGrade(60)).toBe('C');
    expect(ReportCardService.getLetterGrade(40)).toBe('E');
  });
  it('generates a report summary from matching student, exam, and results', async () => {
    const student = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { full_name: 'Jane', student_id: 'S1', class_id: 'class-id', academic_year: '2026', class: { name: 'Grade 1' } }, error: null }) };
    const exam = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { name: 'Final', exam_date: '2026-10-01', academic_year: '2026', class_id: 'class-id' }, error: null }) };
    const results = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), mock: true };
    results.eq = jest.fn().mockReturnValueOnce(results).mockResolvedValue({ data: [{ marks_obtained: 80, grade: null, remarks: 'Good', exam: { max_marks: 100, subject: { name: 'Math', code: 'MAT' } } }], error: null }) as never;
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(student).mockReturnValueOnce(exam).mockReturnValueOnce(results) } as never);
    await expect(ReportCardService.generateReport('student-id', 'exam-id')).resolves.toMatchObject({ summary: { totalObtained: 80, totalMax: 100, overallGrade: 'A', passed: true, resultCount: 1 } });
  });

  it('rejects missing or ineligible report-card records and supports empty results', async () => {
    const studentMissing = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(studentMissing) } as never);
    await expect(ReportCardService.generateReport('student', 'exam')).rejects.toMatchObject({ status: 404 });
    const student = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { full_name: 'Jane', student_id: 'S1', class_id: 'class-a', academic_year: '2026', class: { name: 'Grade 1' } }, error: null }) };
    const exam = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { class_id: 'class-b', academic_year: '2026' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(student).mockReturnValueOnce(exam) } as never);
    await expect(ReportCardService.generateReport('student', 'exam')).rejects.toMatchObject({ status: 409 });
    const matchingExam = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { name: 'Final', exam_date: '2026-10-01', class_id: 'class-a', academic_year: '2026' }, error: null }) };
    const results = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis() };
    results.eq = jest.fn().mockReturnValueOnce(results).mockResolvedValue({ data: [], error: null }) as never;
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(student).mockReturnValueOnce(matchingExam).mockReturnValueOnce(results) } as never);
    await expect(ReportCardService.generateReport('student', 'exam')).resolves.toMatchObject({ summary: { overallGrade: 'Not available', passed: null, resultCount: 0, isComplete: false } });
  });
});
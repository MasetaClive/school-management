import { NextRequest } from 'next/server';

const mockGetCurrentUser = jest.fn();
const mockGetUserRole = jest.fn();
const mockCreateClient = jest.fn();
const mockGetTeacher = jest.fn();
const mockGetExam = jest.fn();
const mockUpdateExam = jest.fn();
const mockDeleteExam = jest.fn();
const mockListResults = jest.fn();
const teacherId = '00000000-0000-4000-8000-000000000002';

jest.mock('@/lib/auth', () => ({ getCurrentUser: mockGetCurrentUser, getUserRole: mockGetUserRole }));
jest.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }));
jest.mock('@/modules/teachers/teacher.service', () => ({ TeacherService: { getTeacherByUserId: mockGetTeacher } }));
jest.mock('@/modules/exams/exam.service', () => ({
  ExamService: { getExamById: mockGetExam, updateExam: mockUpdateExam, deleteExam: mockDeleteExam },
  ExamServiceError: class ExamServiceError extends Error { status = 422; },
}));
jest.mock('@/modules/results/result.service', () => ({ ResultService: { listResults: mockListResults } }));

import * as parentHomework from '../parent/homework/route';
import * as parentResults from '../parent/results/route';
import * as teacherAttendance from '../teacher/attendance/route';
import * as teacherClasses from '../teacher/classes/route';
import * as teacherExam from '../teacher/exams/[id]/route';
import * as teacherResults from '../teacher/results/route';

const request = (url: string, body?: unknown) => new NextRequest(url, {
  method: body === undefined ? 'GET' : 'POST',
  ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
});
const examId = '00000000-0000-4000-8000-000000000001';
const teacherParams = { params: Promise.resolve({ id: examId }) };
const responseJson = async (response: Response) => response.json();

describe('teacher and parent route coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGetUserRole.mockResolvedValue('teacher');
    mockGetTeacher.mockResolvedValue({ id: teacherId });
  });

  it('loads teacher attendance and merges existing records', async () => {
    const subjectAssignment = { limit: jest.fn().mockResolvedValue({ data: [{ id: 'assignment-1' }], error: null }) };
    const classTeacher = { limit: jest.fn().mockResolvedValue({ data: [], error: null }) };
    const students = { order: jest.fn().mockResolvedValue({ data: [{ id: 'student-1', full_name: 'Ada', student_id: 'A1' }], error: null }) };
    const attendance = { eq: jest.fn() };
    attendance.eq.mockReturnValueOnce(attendance).mockResolvedValueOnce({ data: [{ student_id: 'student-1', status: 'late', remarks: 'Bus' }], error: null });
    mockCreateClient.mockResolvedValue({ from: jest.fn()
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), limit: subjectAssignment.limit })
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), limit: classTeacher.limit })
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: students.order })
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: attendance.eq }) });
    const response = await teacherAttendance.GET(request('http://localhost/api/teacher/attendance?class_id=class-1&date=2026-08-27'));
    expect(response.status).toBe(200);
    expect(await responseJson(response)).toEqual({ data: [{ id: 'student-1', full_name: 'Ada', student_id: 'A1', status: 'late', remarks: 'Bus' }] });
  });

  it('rejects unassigned attendance reads and persists valid attendance', async () => {
    const noAssignment = { limit: jest.fn().mockResolvedValue({ data: [], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), limit: noAssignment.limit }) });
    expect((await teacherAttendance.GET(request('http://localhost/api/teacher/attendance?class_id=class-1&date=2026-08-27'))).status).toBe(403);
    const assigned = { limit: jest.fn().mockResolvedValue({ data: [{ id: 'assignment-1' }], error: null }) };
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({ from: jest.fn()
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), limit: assigned.limit })
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), limit: noAssignment.limit })
      .mockReturnValueOnce({ upsert }) });
    const response = await teacherAttendance.POST(request('http://localhost/api/teacher/attendance', { class_id: '00000000-0000-4000-8000-000000000001', date: '2026-08-27', records: [] }));
    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith([], { onConflict: 'student_id,attendance_date' });
  });

  it('returns validation errors for malformed teacher attendance', async () => {
    expect((await teacherAttendance.POST(request('http://localhost/api/teacher/attendance', { class_id: 'bad' }))).status).toBe(400);
  });

  it('deduplicates and sorts teacher classes', async () => {
    const first = { eq: jest.fn().mockResolvedValue({ data: [{ classes: { id: 'b', name: 'Zed', academic_year: '2026' } }, { classes: { id: 'a', name: 'Ada', academic_year: '2026' } }], error: null }) };
    const second = { eq: jest.fn().mockResolvedValue({ data: [{ classes: { id: 'b', name: 'Zed', academic_year: '2026' } }], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce({ select: jest.fn().mockReturnValue(first) }).mockReturnValueOnce({ select: jest.fn().mockReturnValue(second) }) });
    expect(await responseJson(await teacherClasses.GET())).toEqual({ data: [{ id: 'a', name: 'Ada', academic_year: '2026' }, { id: 'b', name: 'Zed', academic_year: '2026' }] });
  });

  it('enforces teacher exam ownership and supports update/delete', async () => {
    mockGetExam.mockResolvedValue({ id: examId, teacher_id: teacherId });
    mockUpdateExam.mockResolvedValue({ id: 'exam-1', name: 'Updated' });
    expect((await teacherExam.GET(request(`http://localhost/api/teacher/exams/${examId}`), teacherParams)).status).toBe(200);
    expect((await teacherExam.PATCH(request(`http://localhost/api/teacher/exams/${examId}`, { name: 'Updated' }), teacherParams)).status).toBe(200);
    expect((await teacherExam.DELETE(request(`http://localhost/api/teacher/exams/${examId}`), teacherParams)).status).toBe(200);
    mockGetExam.mockResolvedValue({ id: examId, teacher_id: 'other-teacher' });
    expect((await teacherExam.GET(request(`http://localhost/api/teacher/exams/${examId}`), teacherParams)).status).toBe(403);
  });

  it('authorizes teacher result access and parent child queries', async () => {
    const examQuery = { eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { teacher_id: teacherId }, error: null }) };
    mockCreateClient.mockResolvedValueOnce({ from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue(examQuery) }) });
    mockListResults.mockResolvedValue({ data: [], total: 0 });
    expect((await teacherResults.GET(request(`http://localhost/api/teacher/results?exam_id=${examId}`))).status).toBe(200);
    mockGetUserRole.mockResolvedValue('parent');
    const parent = { eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'parent-1' }, error: null }) };
    const children = { eq: jest.fn().mockResolvedValue({ data: [{ class_id: 'class-1' }], error: null }) };
    const homework = { order: jest.fn().mockResolvedValue({ data: [{ id: 'homework-1' }], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce({ select: jest.fn().mockReturnValue(parent) }).mockReturnValueOnce({ select: jest.fn().mockReturnValue(children) }).mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: jest.fn().mockReturnValue(homework) }) }) });
    expect((await parentHomework.GET()).status).toBe(200);
    const resultChildren = { order: jest.fn().mockResolvedValue({ data: [{ id: 'student-1', full_name: 'Ada', student_id: 'A1' }], error: null }) };
    const results = { order: jest.fn().mockResolvedValue({ data: [{ id: 'result-1', student_id: 'student-1' }], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce({ select: jest.fn().mockReturnValue(parent) }).mockReturnValueOnce({ select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue(resultChildren) }) }).mockReturnValueOnce({ select: jest.fn().mockReturnValue({ in: jest.fn().mockReturnValue(results) }) }) });
    expect((await parentResults.GET()).status).toBe(200);
  });
});
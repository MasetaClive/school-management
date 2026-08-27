import { NextRequest } from 'next/server';

const mockGetCurrentUser = jest.fn();
const mockGetUserRole = jest.fn();
const mockCreateClient = jest.fn();
const mockParentDashboard = jest.fn();
const mockStudentDashboard = jest.fn();
const mockBorrowBook = jest.fn();
const mockGetTeacher = jest.fn();
const mockTeacherStats = jest.fn();
const mockUpdateTeacher = jest.fn();
const mockListExams = jest.fn();
const mockCreateExam = jest.fn();
const mockGetExam = jest.fn();
const mockUpdateExam = jest.fn();
const mockDeleteExam = jest.fn();
const mockListHomework = jest.fn();
const mockCreateHomework = jest.fn();
const mockGetHomework = jest.fn();
const mockUpdateHomework = jest.fn();
const mockDeleteHomework = jest.fn();
const mockGenerateReport = jest.fn();
const mockListResults = jest.fn();
const mockCreateResult = jest.fn();
const mockGetResult = jest.fn();
const mockUpdateResult = jest.fn();

jest.mock('@/lib/auth', () => ({ getCurrentUser: mockGetCurrentUser, getUserRole: mockGetUserRole }));
jest.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }));
jest.mock('@/modules/parents/parent.service', () => ({ ParentService: { getDashboardData: mockParentDashboard }, ParentServiceError: class ParentServiceError extends Error { status = 500; } }));
jest.mock('@/modules/students/student.service', () => ({ StudentService: { getStudentDashboardData: mockStudentDashboard } }));
jest.mock('@/modules/library/library.service', () => ({ LibraryService: { borrowBook: mockBorrowBook }, LibraryServiceError: class LibraryServiceError extends Error { status = 400; } }));
jest.mock('@/modules/teachers/teacher.service', () => ({ TeacherService: { getTeacherByUserId: mockGetTeacher, getDashboardStats: mockTeacherStats, updateTeacher: mockUpdateTeacher } }));
jest.mock('@/modules/exams/exam.service', () => ({ ExamService: { listExams: mockListExams, createExam: mockCreateExam, getExamById: mockGetExam, updateExam: mockUpdateExam, deleteExam: mockDeleteExam }, ExamServiceError: class ExamServiceError extends Error { status = 400; } }));
jest.mock('@/modules/homework/homework.service', () => ({ HomeworkService: { listHomework: mockListHomework, createHomework: mockCreateHomework, getHomeworkById: mockGetHomework, updateHomework: mockUpdateHomework, deleteHomework: mockDeleteHomework }, HomeworkServiceError: class HomeworkServiceError extends Error { status = 400; } }));
jest.mock('@/modules/report-cards/reportCard.service', () => ({ ReportCardService: { generateReport: mockGenerateReport }, ReportCardServiceError: class ReportCardServiceError extends Error { status = 400; } }));
jest.mock('@/modules/results/result.service', () => ({ ResultService: { listResults: mockListResults, createResult: mockCreateResult, getResultById: mockGetResult, updateResult: mockUpdateResult }, ResultServiceError: class ResultServiceError extends Error { status = 400; } }));

import * as parentAttendance from '../parent/attendance/route';
import * as parentDashboard from '../parent/dashboard/route';
import * as parentHomework from '../parent/homework/route';
import * as parentReports from '../parent/report-cards/route';
import * as parentResults from '../parent/results/route';
import * as studentClasses from '../student/classes/route';
import * as studentDashboard from '../student/dashboard/route';
import * as studentHomework from '../student/homework/route';
import * as studentBorrow from '../student/library/borrow/route';
import * as studentResults from '../student/results/route';
import * as studentNotifications from '../student/settings/notifications/route';
import * as studentPassword from '../student/settings/password/route';
import * as studentTimetable from '../student/timetable/route';
import * as teacherAttendance from '../teacher/attendance/route';
import * as teacherClasses from '../teacher/classes/route';
import * as teacherClass from '../teacher/classes/[id]/route';
import * as teacherStats from '../teacher/dashboard/stats/route';
import * as teacherExams from '../teacher/exams/route';
import * as teacherExam from '../teacher/exams/[id]/route';
import * as teacherHomework from '../teacher/homework/route';
import * as teacherHomeworkById from '../teacher/homework/[id]/route';
import * as teacherProfile from '../teacher/profile/route';
import * as teacherReports from '../teacher/report-cards/route';
import * as teacherResults from '../teacher/results/route';
import * as teacherResult from '../teacher/results/[id]/route';
import * as teacherSubjects from '../teacher/subjects/route';
import * as teacherTimetable from '../teacher/timetable/route';

const request = (url = 'http://localhost/api/test', body?: unknown) => new NextRequest(url, {
  method: body === undefined ? 'GET' : 'POST',
  ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
});
const params = { params: Promise.resolve({ id: '00000000-0000-4000-8000-000000000001' }) };
const json = async (response: Response) => response.json();

describe('parent, student, and teacher API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(null);
    mockGetUserRole.mockResolvedValue('student');
    mockCreateClient.mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) } });
  });

  it.each([
    ['parent attendance', parentAttendance.GET], ['parent dashboard', parentDashboard.GET], ['parent homework', parentHomework.GET],
    ['parent report cards', parentReports.GET], ['parent results', parentResults.GET],
    ['student classes', studentClasses.GET], ['student dashboard', studentDashboard.GET], ['student homework', studentHomework.GET],
    ['student borrow', studentBorrow.POST], ['student results', studentResults.GET], ['student notifications', studentNotifications.POST],
    ['student password', studentPassword.POST], ['student timetable', studentTimetable.GET],
    ['teacher attendance GET', teacherAttendance.GET], ['teacher attendance POST', teacherAttendance.POST], ['teacher classes', teacherClasses.GET],
    ['teacher class by id', teacherClass.GET], ['teacher stats', teacherStats.GET], ['teacher exams GET', teacherExams.GET], ['teacher exams POST', teacherExams.POST],
    ['teacher exam GET', teacherExam.GET], ['teacher exam PATCH', teacherExam.PATCH], ['teacher exam DELETE', teacherExam.DELETE],
    ['teacher homework GET', teacherHomework.GET], ['teacher homework POST', teacherHomework.POST], ['teacher homework GET by id', teacherHomeworkById.GET],
    ['teacher homework PATCH', teacherHomeworkById.PATCH], ['teacher homework DELETE', teacherHomeworkById.DELETE], ['teacher profile GET', teacherProfile.GET],
    ['teacher profile PUT', teacherProfile.PUT], ['teacher reports', teacherReports.GET], ['teacher results GET', teacherResults.GET], ['teacher results POST', teacherResults.POST],
    ['teacher result GET', teacherResult.GET], ['teacher result PATCH', teacherResult.PATCH], ['teacher subjects', teacherSubjects.GET], ['teacher timetable', teacherTimetable.GET],
  ])('%s rejects an unauthenticated request', async (_name, handler) => {
    const result = await (handler as Function)(request(), params);
    expect(result.status).toBe(401);
  });

  it('returns parent dashboard data and handles parent attendance empty children and database failure', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'parent-user' });
    mockGetUserRole.mockResolvedValue('parent');
    mockParentDashboard.mockResolvedValue({ parent: { id: 'p' }, children: [] });
    expect(await json(await parentDashboard.GET())).toEqual({ parent: { id: 'p' }, children: [] });
    const parent = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'p' }, error: null }) };
    const children = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(parent).mockReturnValue(children) });
    expect((await parentAttendance.GET()).status).toBe(200);
    parent.maybeSingle.mockResolvedValue({ data: null, error: new Error('db') });
    expect((await parentAttendance.GET()).status).toBe(500);
  });

  it('covers parent homework/results/report validation and successful report access', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'parent-user' });
    mockGetUserRole.mockResolvedValue('parent');
    const parentQuery = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'p' }, error: null }) };
    const childQuery = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(parentQuery).mockReturnValue(childQuery) });
    expect((await parentHomework.GET()).status).toBe(200);
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(parentQuery).mockReturnValue(childQuery) });
    expect((await parentResults.GET()).status).toBe(200);
    expect((await parentReports.GET(request('http://localhost/api/parent/report-cards'))).status).toBe(400);
    const child = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'child' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(parentQuery).mockReturnValueOnce(child) });
    mockGenerateReport.mockResolvedValue({ grades: [] });
    expect((await parentReports.GET(request('http://localhost/api/parent/report-cards?student_id=s&exam_id=e'))).status).toBe(200);
  });

  it('covers student success, validation, service failure, and preference/password updates', async () => {
    const user = { id: 'user', user_metadata: { role: 'student' } };
    const profile = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'student', class_id: 'class' }, error: null }) };
    const dataQuery = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'student', class_id: 'class' }, error: null }), order: jest.fn().mockResolvedValue({ data: [], error: null }) };
    const auth = { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }), updateUser: jest.fn().mockResolvedValue({ data: { user: { user_metadata: { sms_notifications: true } } }, error: null }) };
    mockCreateClient.mockResolvedValue({ auth, from: jest.fn().mockReturnValueOnce(profile).mockReturnValue(dataQuery) });
    expect((await studentDashboard.GET()).status).toBe(200);
    expect((await studentHomework.GET()).status).toBe(200);
    expect((await studentResults.GET()).status).toBe(200);
    expect((await studentClasses.GET()).status).toBe(200);
    expect((await studentTimetable.GET()).status).toBe(200);
    expect((await studentBorrow.POST(request('http://localhost/api/student/library/borrow', {}), undefined))).toMatchObject({ status: 400 });
    expect((await studentNotifications.POST(request('http://localhost/api/student/settings/notifications', { sms_notifications: true })))).toMatchObject({ status: 200 });
    expect((await studentPassword.POST(request('http://localhost/api/student/settings/password', { password: 'short' })))).toMatchObject({ status: 400 });
    mockBorrowBook.mockRejectedValue(new Error('library down'));
    expect((await studentBorrow.POST(request('http://localhost/api/student/library/borrow', { book_id: 'b' })))).toMatchObject({ status: 500 });
  });

  it('returns teacher profile/stats and exercises teacher query, validation, ownership, and success paths', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'teacher-user' });
    mockGetUserRole.mockResolvedValue('teacher');
    mockGetTeacher.mockResolvedValue({ id: 'teacher-1' });
    mockTeacherStats.mockResolvedValue({ classCount: 1 });
    expect((await teacherStats.GET()).status).toBe(200);
    mockGetTeacher.mockResolvedValue(null);
    expect((await teacherProfile.GET()).status).toBe(404);
    mockGetTeacher.mockResolvedValue({ id: 'teacher-1' });
    expect((await teacherSubjects.GET(request('http://localhost/api/teacher/subjects'))).status).toBe(400);
    expect((await teacherReports.GET(request('http://localhost/api/teacher/report-cards'))).status).toBe(400);
    expect((await teacherAttendance.GET(request('http://localhost/api/teacher/attendance'))).status).toBe(400);
    expect((await teacherHomework.POST(request('http://localhost/api/teacher/homework', {})))).toMatchObject({ status: 400 });
    expect((await teacherExams.POST(request('http://localhost/api/teacher/exams', {})))).toMatchObject({ status: 400 });
    expect((await teacherResult.GET(request(), params))).toMatchObject({ status: 500 });
  });
});
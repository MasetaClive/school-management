import { NextRequest } from 'next/server';

const mockRouteFunctions: jest.Mock[] = [];
const mockNamespace = () => new Proxy<Record<string, jest.Mock>>({}, {
  get(target, property: string) {
    if (!target[property]) {
      target[property] = jest.fn().mockName(property).mockImplementation(() => response);
      mockRouteFunctions.push(target[property]);
    }
    return target[property];
  },
});
const mockCreateRouteModule = () => new Proxy<Record<string, jest.Mock>>({}, {
  get(target, property: string) {
    if (property.endsWith('Routes')) {
      if (!target[property]) target[property] = mockNamespace() as unknown as jest.Mock;
      return target[property];
    }
    if (!target[property]) {
      target[property] = jest.fn().mockName(property).mockImplementation(() => response);
      mockRouteFunctions.push(target[property]);
    }
    return target[property];
  },
});

jest.mock('@/modules/academic-years/academicYear.routes', () => mockCreateRouteModule());
jest.mock('@/modules/announcements/announcement.routes', () => mockCreateRouteModule());
jest.mock('@/modules/class-teachers/classTeacher.routes', () => mockCreateRouteModule());
jest.mock('@/modules/classes/class.routes', () => mockCreateRouteModule());
jest.mock('@/modules/exams/exam.routes', () => mockCreateRouteModule());
jest.mock('@/modules/fees/fees.routes', () => mockCreateRouteModule());
jest.mock('@/modules/homework/homework.routes', () => mockCreateRouteModule());
jest.mock('@/modules/inventory/inventory.routes', () => mockCreateRouteModule());
jest.mock('@/modules/library/library.routes', () => mockCreateRouteModule());
jest.mock('@/modules/parents/parent.routes', () => mockCreateRouteModule());
jest.mock('@/modules/payroll/payroll.routes', () => mockCreateRouteModule());
jest.mock('@/modules/report-cards/reportCard.routes', () => mockCreateRouteModule());
jest.mock('@/modules/reports/report.routes', () => mockCreateRouteModule());
jest.mock('@/modules/results/result.routes', () => mockCreateRouteModule());
jest.mock('@/modules/rollover/rollover.routes', () => mockCreateRouteModule());
jest.mock('@/modules/settings/settings.routes', () => mockCreateRouteModule());
jest.mock('@/modules/student-attendance/studentAttendance.routes', () => mockCreateRouteModule());
jest.mock('@/modules/students/student.routes', () => mockCreateRouteModule());
jest.mock('@/modules/subject-assignments/subjectAssignment.routes', () => mockCreateRouteModule());
jest.mock('@/modules/subjects/subject.routes', () => mockCreateRouteModule());
jest.mock('@/modules/teacher-attendance/teacherAttendance.routes', () => mockCreateRouteModule());
jest.mock('@/modules/teachers/teacher.routes', () => mockCreateRouteModule());
jest.mock('@/modules/time-slots/timeSlot.routes', () => mockCreateRouteModule());
jest.mock('@/modules/timetables/timetable.routes', () => mockCreateRouteModule());
jest.mock('@/modules/transport/transport.routes', () => mockCreateRouteModule());
jest.mock('@/modules/users/user.routes', () => mockCreateRouteModule());

const mockUserUpdate = jest.fn();
const mockUserDelete = jest.fn();
jest.mock('@/modules/users/user.controller', () => ({
  UserController: { update: mockUserUpdate, delete: mockUserDelete },
}));

const mockGetCurrentUser = jest.fn();
const mockGetUserRole = jest.fn();
const mockGetDashboardStats = jest.fn();
jest.mock('@/lib/auth', () => ({ getCurrentUser: mockGetCurrentUser, getUserRole: mockGetUserRole }));
jest.mock('@/modules/stats/stats.service', () => ({ StatsService: { getDashboardStats: mockGetDashboardStats } }));

const mockCreateClient = jest.fn();
jest.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }));

import { getCurrentUser, getUserRole } from '@/lib/auth';
import { StatsService } from '@/modules/stats/stats.service';
import { createClient } from '@/lib/supabase/server';
import { GET as getStats } from '../stats/route';
import { GET as getPayments } from '../fees/payments/route';
import { POST as postPayment } from '../fees/payments/route';
import { GET as getUser, PATCH as patchUser, DELETE as deleteUser } from '../users/[id]/route';

const request = (method = 'GET') => new NextRequest('http://localhost/api/admin/test', { method });
const response = new Response(JSON.stringify({ ok: true }), { status: 200 });
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const studentParams = (studentId: string) => ({ params: Promise.resolve({ studentId }) });

const delegatorCases: Array<{
  file: string;
  handler: string;
  method: string;
  id?: string;
  wrappedParams?: 'id' | 'studentId';
}> = [
  { file: '../academic-years/route', handler: 'GET', method: 'listAcademicYearsRoute' },
  { file: '../academic-years/route', handler: 'POST', method: 'createAcademicYearRoute' },
  { file: '../academic-years/[id]/route', handler: 'PATCH', method: 'updateAcademicYearRoute', id: 'academic-year-1' },
  { file: '../academic-years/[id]/route', handler: 'GET', method: 'getAcademicYearRoute', id: 'academic-year-1' },
  { file: '../academic-years/[id]/route', handler: 'DELETE', method: 'deleteAcademicYearRoute', id: 'academic-year-1' },
  { file: '../announcements/route', handler: 'GET', method: 'LIST' },
  { file: '../announcements/route', handler: 'POST', method: 'CREATE' },
  { file: '../class-teachers/route', handler: 'GET', method: 'listClassTeachersRoute' },
  { file: '../class-teachers/route', handler: 'POST', method: 'createClassTeacherRoute' },
  { file: '../class-teachers/[id]/route', handler: 'PATCH', method: 'updateClassTeacherRoute', id: 'class-teacher-1', wrappedParams: 'id' },
  { file: '../class-teachers/[id]/route', handler: 'GET', method: 'getClassTeacherRoute', id: 'class-teacher-1', wrappedParams: 'id' },
  { file: '../class-teachers/[id]/route', handler: 'DELETE', method: 'deleteClassTeacherRoute', id: 'class-teacher-1', wrappedParams: 'id' },
  { file: '../classes/route', handler: 'GET', method: 'listClassesRoute' },
  { file: '../classes/route', handler: 'POST', method: 'createClassRoute' },
  { file: '../classes/[id]/route', handler: 'GET', method: 'getClassRoute', id: 'class-1' },
  { file: '../classes/[id]/route', handler: 'PATCH', method: 'updateClassRoute', id: 'class-1' },
  { file: '../classes/[id]/route', handler: 'DELETE', method: 'deleteClassRoute', id: 'class-1' },
  { file: '../exams/route', handler: 'GET', method: 'listExamsRoute' },
  { file: '../exams/route', handler: 'POST', method: 'createExamRoute' },
  { file: '../exams/[id]/route', handler: 'GET', method: 'getExamRoute', id: 'exam-1' },
  { file: '../exams/[id]/route', handler: 'PATCH', method: 'updateExamRoute', id: 'exam-1' },
  { file: '../exams/[id]/route', handler: 'DELETE', method: 'deleteExamRoute', id: 'exam-1' },
  { file: '../fees/assign/route', handler: 'POST', method: 'ASSIGN_FEE' },
  { file: '../fees/types/route', handler: 'GET', method: 'LIST_TYPES' },
  { file: '../fees/types/route', handler: 'POST', method: 'CREATE_TYPE' },
  { file: '../fees/student/[studentId]/route', handler: 'GET', method: 'GET_STUDENT_FEES', id: 'student-1', wrappedParams: 'studentId' },
  { file: '../fees/payments/route', handler: 'POST', method: 'RECORD_PAYMENT' },
  { file: '../homework/route', handler: 'GET', method: 'LIST' },
  { file: '../homework/route', handler: 'POST', method: 'CREATE' },
  { file: '../homework/[id]/route', handler: 'GET', method: 'GET_BY_ID', id: 'homework-1', wrappedParams: 'id' },
  { file: '../homework/[id]/route', handler: 'PATCH', method: 'UPDATE', id: 'homework-1', wrappedParams: 'id' },
  { file: '../homework/[id]/route', handler: 'DELETE', method: 'DELETE', id: 'homework-1', wrappedParams: 'id' },
  { file: '../inventory/items/route', handler: 'GET', method: 'LIST_ITEMS' },
  { file: '../inventory/items/route', handler: 'POST', method: 'ADD_ITEM' },
  { file: '../library/books/route', handler: 'GET', method: 'LIST_BOOKS' },
  { file: '../library/books/route', handler: 'POST', method: 'ADD_BOOK' },
  { file: '../library/borrow/route', handler: 'GET', method: 'LIST_RECORDS' },
  { file: '../library/borrow/route', handler: 'POST', method: 'BORROW' },
  { file: '../library/return/[id]/route', handler: 'PATCH', method: 'RETURN', id: 'borrow-1', wrappedParams: 'id' },
  { file: '../parents/route', handler: 'GET', method: 'listParentsRoute' },
  { file: '../parents/route', handler: 'POST', method: 'createParentRoute' },
  { file: '../parents/[id]/route', handler: 'GET', method: 'getParentRoute', id: 'parent-1' },
  { file: '../parents/[id]/route', handler: 'PATCH', method: 'updateParentRoute', id: 'parent-1' },
  { file: '../parents/[id]/route', handler: 'DELETE', method: 'deleteParentRoute', id: 'parent-1' },
  { file: '../payroll/route', handler: 'GET', method: 'LIST_HISTORY' },
  { file: '../payroll/route', handler: 'POST', method: 'GENERATE' },
  { file: '../payroll/configs/route', handler: 'GET', method: 'LIST_CONFIGS' },
  { file: '../payroll/configs/route', handler: 'POST', method: 'SET_CONFIG' },
  { file: '../report-cards/[studentId]/route', handler: 'GET', method: 'GET_REPORT', id: 'student-1', wrappedParams: 'studentId' },
  { file: '../reports/academic/route', handler: 'GET', method: 'ACADEMIC' },
  { file: '../reports/financial/route', handler: 'GET', method: 'FINANCIAL' },
  { file: '../results/route', handler: 'GET', method: 'listResultsRoute' },
  { file: '../results/route', handler: 'POST', method: 'createResultRoute' },
  { file: '../results/[id]/route', handler: 'GET', method: 'getResultRoute', id: 'result-1' },
  { file: '../results/[id]/route', handler: 'PATCH', method: 'updateResultRoute', id: 'result-1' },
  { file: '../results/[id]/route', handler: 'DELETE', method: 'deleteResultRoute', id: 'result-1' },
  { file: '../rollover/route', handler: 'GET', method: 'GET_STUDENTS' },
  { file: '../rollover/route', handler: 'POST', method: 'PROMOTE' },
  { file: '../settings/route', handler: 'GET', method: 'LIST' },
  { file: '../settings/route', handler: 'POST', method: 'UPDATE' },
  { file: '../student-attendance/route', handler: 'GET', method: 'listStudentAttendanceRoute' },
  { file: '../student-attendance/route', handler: 'POST', method: 'createStudentAttendanceRoute' },
  { file: '../student-attendance/[id]/route', handler: 'GET', method: 'getStudentAttendanceRoute', id: 'attendance-1' },
  { file: '../student-attendance/[id]/route', handler: 'PATCH', method: 'updateStudentAttendanceRoute', id: 'attendance-1' },
  { file: '../student-attendance/[id]/route', handler: 'DELETE', method: 'deleteStudentAttendanceRoute', id: 'attendance-1' },
  { file: '../students/[id]/route', handler: 'GET', method: 'getStudentRoute', id: 'student-1' },
  { file: '../students/[id]/route', handler: 'PATCH', method: 'updateStudentRoute', id: 'student-1' },
  { file: '../students/[id]/route', handler: 'DELETE', method: 'deleteStudentRoute', id: 'student-1' },
  { file: '../subject-assignments/route', handler: 'GET', method: 'listSubjectAssignmentsRoute' },
  { file: '../subject-assignments/route', handler: 'POST', method: 'createSubjectAssignmentRoute' },
  { file: '../subject-assignments/[id]/route', handler: 'GET', method: 'getSubjectAssignmentRoute', id: 'assignment-1' },
  { file: '../subject-assignments/[id]/route', handler: 'PATCH', method: 'updateSubjectAssignmentRoute', id: 'assignment-1' },
  { file: '../subject-assignments/[id]/route', handler: 'DELETE', method: 'deleteSubjectAssignmentRoute', id: 'assignment-1' },
  { file: '../subjects/route', handler: 'GET', method: 'listSubjectsRoute' },
  { file: '../subjects/route', handler: 'POST', method: 'createSubjectRoute' },
  { file: '../subjects/[id]/route', handler: 'GET', method: 'getSubjectRoute', id: 'subject-1' },
  { file: '../subjects/[id]/route', handler: 'PATCH', method: 'updateSubjectRoute', id: 'subject-1' },
  { file: '../subjects/[id]/route', handler: 'DELETE', method: 'deleteSubjectRoute', id: 'subject-1' },
  { file: '../teacher-attendance/route', handler: 'GET', method: 'listTeacherAttendanceRoute' },
  { file: '../teacher-attendance/route', handler: 'POST', method: 'createTeacherAttendanceRoute' },
  { file: '../teacher-attendance/[id]/route', handler: 'GET', method: 'getTeacherAttendanceRoute', id: 'teacher-attendance-1' },
  { file: '../teacher-attendance/[id]/route', handler: 'PATCH', method: 'updateTeacherAttendanceRoute', id: 'teacher-attendance-1' },
  { file: '../teacher-attendance/[id]/route', handler: 'DELETE', method: 'deleteTeacherAttendanceRoute', id: 'teacher-attendance-1' },
  { file: '../teachers/route', handler: 'GET', method: 'listTeachersRoute' },
  { file: '../teachers/route', handler: 'POST', method: 'createTeacherRoute' },
  { file: '../teachers/[id]/route', handler: 'GET', method: 'getTeacherRoute', id: 'teacher-1' },
  { file: '../teachers/[id]/route', handler: 'PATCH', method: 'updateTeacherRoute', id: 'teacher-1' },
  { file: '../teachers/[id]/route', handler: 'DELETE', method: 'deleteTeacherRoute', id: 'teacher-1' },
  { file: '../time-slots/route', handler: 'GET', method: 'listTimeSlotsRoute' },
  { file: '../time-slots/route', handler: 'POST', method: 'createTimeSlotRoute' },
  { file: '../time-slots/[id]/route', handler: 'GET', method: 'getTimeSlotRoute', id: 'slot-1' },
  { file: '../time-slots/[id]/route', handler: 'PATCH', method: 'updateTimeSlotRoute', id: 'slot-1' },
  { file: '../time-slots/[id]/route', handler: 'DELETE', method: 'deleteTimeSlotRoute', id: 'slot-1' },
  { file: '../timetables/route', handler: 'GET', method: 'listTimetablesRoute' },
  { file: '../timetables/route', handler: 'POST', method: 'createTimetableRoute' },
  { file: '../timetables/[id]/route', handler: 'GET', method: 'getTimetableRoute', id: 'timetable-1' },
  { file: '../timetables/[id]/route', handler: 'PATCH', method: 'updateTimetableRoute', id: 'timetable-1' },
  { file: '../timetables/[id]/route', handler: 'DELETE', method: 'deleteTimetableRoute', id: 'timetable-1' },
  { file: '../timetables/slots/route', handler: 'GET', method: 'getTimeSlotsRoute' },
  { file: '../transport/routes/route', handler: 'GET', method: 'LIST_ROUTES' },
  { file: '../transport/routes/route', handler: 'POST', method: 'CREATE_ROUTE' },
  { file: '../transport/assignments/route', handler: 'GET', method: 'LIST_ASSIGNMENTS' },
  { file: '../transport/assignments/route', handler: 'POST', method: 'ASSIGN_STUDENT' },
  { file: '../users/route', handler: 'GET', method: 'listUsersRoute' },
  { file: '../users/route', handler: 'POST', method: 'createUserRoute' },
  { file: '../users/entities/route', handler: 'GET', method: 'getUnlinkedEntitiesRoute' },
];

delegatorCases.forEach((testCase) => require(testCase.file));

describe('admin API delegator routes', () => {
  beforeEach(() => {
    mockRouteFunctions.forEach((handler) => {
      handler.mockClear();
      handler.mockResolvedValue(response);
    });
  });

  it.each(delegatorCases)('$file exports $handler and delegates its request', async (testCase) => {
    const route = require(testCase.file) as Record<string, Function>;
    const req = request(testCase.handler === 'POST' || testCase.handler === 'PATCH' ? testCase.handler : 'GET');
    const result = testCase.wrappedParams === 'studentId'
      ? await route[testCase.handler](req, studentParams(testCase.id!))
      : testCase.wrappedParams === 'id'
        ? await route[testCase.handler](req, params(testCase.id!))
        : testCase.id
          ? await route[testCase.handler](req, params(testCase.id))
          : await route[testCase.handler](req);

    expect(result).toBe(response);
    const called = mockRouteFunctions.filter((handler) => handler.mock.calls.length > 0);
    expect(called).toHaveLength(1);
    if (testCase.wrappedParams) {
      expect(called[0]).toHaveBeenCalledWith(req, { params: { [testCase.wrappedParams]: testCase.id } });
    } else if (testCase.id) {
      expect(called[0]).toHaveBeenCalledWith(req, testCase.id);
    } else {
      expect(called[0]).toHaveBeenCalledWith(req);
    }
  });
});

describe('admin fees payments route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('delegates POST and preserves the exact response', async () => {
    const delegated = new Response('created', { status: 201 });
    const handler = mockRouteFunctions.find((item) => item.getMockName() === 'RECORD_PAYMENT')!;
    handler.mockResolvedValue(delegated);
    const req = request('POST');

    await expect(postPayment(req)).resolves.toBe(delegated);
    expect(handler).toHaveBeenCalledWith(req);
  });

  it('returns fetched payments in descending creation order', async () => {
    const order = jest.fn().mockResolvedValue({ data: [{ id: 'payment-1' }], error: null });
    const query = { select: jest.fn().mockReturnValue({ order }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) });

    const result = await getPayments(request());

    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual([{ id: 'payment-1' }]);
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('returns 500 when payment lookup reports an error or throws', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: new Error('database') });
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ order }) }) });
    expect((await getPayments(request())).status).toBe(500);

    mockCreateClient.mockRejectedValue(new Error('connection'));
    const thrown = await getPayments(request());
    expect(thrown.status).toBe(500);
    await expect(thrown.json()).resolves.toEqual({ error: 'Internal server error' });
  });
});

describe('admin stats route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 without a current user', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);
    const result = await getStats();
    expect(result.status).toBe(401);
    await expect(result.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 403 for a non-admin user', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (getUserRole as jest.Mock).mockResolvedValue('teacher');
    const result = await getStats();
    expect(result.status).toBe(403);
    await expect(result.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('returns dashboard stats for an admin', async () => {
    const stats = { students: 4, teachers: 2 };
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'admin-1' });
    (getUserRole as jest.Mock).mockResolvedValue('admin');
    (StatsService.getDashboardStats as jest.Mock).mockResolvedValue(stats);
    const result = await getStats();
    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual(stats);
  });

  it('returns 500 when stats loading fails', async () => {
    (getCurrentUser as jest.Mock).mockRejectedValue(new Error('database'));
    const result = await getStats();
    expect(result.status).toBe(500);
    await expect(result.json()).resolves.toEqual({ error: 'Internal Server Error' });
  });
});

describe('admin users/[id] route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the explicit not-implemented response for GET', async () => {
    const result = await getUser(request(), params('user-1'));
    expect(result.status).toBe(501);
    await expect(result.json()).resolves.toEqual({ error: 'Single user fetch not implemented via API yet' });
  });

  it('updates a user with the awaited id and preserves the response', async () => {
    const delegated = new Response('updated', { status: 200 });
    mockUserUpdate.mockResolvedValue(delegated);
    const req = request('PATCH');
    await expect(patchUser(req, params('user-1'))).resolves.toBe(delegated);
    expect(mockUserUpdate).toHaveBeenCalledWith(req, 'user-1');
  });

  it('maps update failures to a 500 response with the error message', async () => {
    mockUserUpdate.mockRejectedValue(new Error('invalid update'));
    const result = await patchUser(request('PATCH'), params('user-1'));
    expect(result.status).toBe(500);
    await expect(result.json()).resolves.toEqual({ error: 'Internal Server Error', message: 'invalid update' });
  });

  it('deletes a user with the awaited id and preserves the response', async () => {
    const delegated = new Response(null, { status: 204 });
    mockUserDelete.mockResolvedValue(delegated);
    const req = request('DELETE');
    await expect(deleteUser(req, params('user-1'))).resolves.toBe(delegated);
    expect(mockUserDelete).toHaveBeenCalledWith(req, 'user-1');
  });

  it('maps delete failures to a 500 response', async () => {
    mockUserDelete.mockRejectedValue(new Error('delete failed'));
    const result = await deleteUser(request('DELETE'), params('user-1'));
    expect(result.status).toBe(500);
    await expect(result.json()).resolves.toEqual({ error: 'Internal Server Error' });
  });
});

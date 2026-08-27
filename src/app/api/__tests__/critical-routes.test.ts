import { NextRequest } from 'next/server';
import { POST as markAttendance } from '../attendance/route';
import { POST as changePassword } from '../auth/password/route';
import { GET as getRole } from '../auth/role/route';
import { GET as parentDashboard } from '../parent/dashboard/route';
import { GET as studentDashboard } from '../student/dashboard/route';
import { GET as teacherStats } from '../teacher/dashboard/stats/route';

jest.mock('@/lib/auth', () => ({ getCurrentUser: jest.fn(), getUserRole: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/modules/parents/parent.service', () => ({ ParentService: { getDashboardData: jest.fn() } }));
jest.mock('@/modules/students/student.service', () => ({ StudentService: { getStudentDashboardData: jest.fn() } }));
jest.mock('@/modules/teachers/teacher.service', () => ({ TeacherService: { getTeacherByUserId: jest.fn(), getDashboardStats: jest.fn() } }));

import { getCurrentUser, getUserRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ParentService } from '@/modules/parents/parent.service';
import { StudentService } from '@/modules/students/student.service';
import { TeacherService } from '@/modules/teachers/teacher.service';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const json = async (response: Response) => response.json();

describe('critical API routes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects attendance requests from non-admin/non-teacher roles', async () => {
    jest.mocked(getUserRole).mockResolvedValue('student' as never);
    const response = await markAttendance(new NextRequest('http://localhost/api/attendance', { method: 'POST', body: '{}' }));
    expect(response.status).toBe(403);
    await expect(json(response)).resolves.toEqual({ error: 'Forbidden' });
  });

  it('rejects invalid attendance input for an authorized role', async () => {
    jest.mocked(getUserRole).mockResolvedValue('teacher' as never);
    const response = await markAttendance(new NextRequest('http://localhost/api/attendance', { method: 'POST', body: '{}' }));
    expect(response.status).toBe(400);
    await expect(json(response)).resolves.toMatchObject({ error: 'Invalid input' });
  });

  it('marks attendance after finding the student', async () => {
    jest.mocked(getUserRole).mockResolvedValue('admin' as never);
    const studentQuery = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: 'student-id', class_id: 'class-id', parents: null }, error: null }) };
    const attendanceQuery = { upsert: jest.fn().mockResolvedValue({ error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(studentQuery).mockReturnValueOnce(attendanceQuery) } as never);
    const response = await markAttendance(new NextRequest('http://localhost/api/attendance', { method: 'POST', body: JSON.stringify({ studentId: '00000000-0000-4000-8000-000000000001', date: '2026-08-27', status: 'present' }) }));
    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toEqual({ success: true });
  });

  it('rejects unauthenticated password changes', async () => {
    const client = { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'No session' } }) } };
    mockCreateClient.mockResolvedValue(client as never);
    const response = await changePassword(new NextRequest('http://localhost/api/auth/password', { method: 'POST', body: JSON.stringify({ password: 'secret' }) }));
    expect(response.status).toBe(401);
  });

  it('updates the password and clears the forced-change flag', async () => {
    const updateUser = jest.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { user_metadata: { role: 'student' } } }, error: null }), updateUser } } as never);
    const response = await changePassword(new NextRequest('http://localhost/api/auth/password', { method: 'POST', body: JSON.stringify({ password: 'secret' }) }));
    expect(response.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith({ password: 'secret', data: { role: 'student', force_password_change: false } });
  });

  it('returns the current role', async () => {
    jest.mocked(getUserRole).mockResolvedValue('teacher' as never);
    await expect(getRole()).resolves.toMatchObject({ status: 200 });
  });

  it('authorizes parent dashboard requests and returns service data', async () => {
    jest.mocked(getCurrentUser).mockResolvedValue({ id: 'parent-user' } as never);
    jest.mocked(getUserRole).mockResolvedValue('parent' as never);
    jest.mocked(ParentService.getDashboardData).mockResolvedValue({ parent: { id: 'parent-id' }, children: [] } as never);
    const response = await parentDashboard();
    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toEqual({ parent: { id: 'parent-id' }, children: [] });
  });

  it('rejects a student dashboard request without a session', async () => {
    mockCreateClient.mockResolvedValue({ auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }) } } as never);
    const response = await studentDashboard();
    expect(response.status).toBe(401);
  });

  it('returns teacher dashboard stats for an authorized teacher', async () => {
    jest.mocked(getCurrentUser).mockResolvedValue({ id: 'teacher-user' } as never);
    jest.mocked(getUserRole).mockResolvedValue('teacher' as never);
    jest.mocked(TeacherService.getTeacherByUserId).mockResolvedValue({ id: 'teacher-id' } as never);
    jest.mocked(TeacherService.getDashboardStats).mockResolvedValue({ classCount: 1, homeworkCount: 2, schedule: [] } as never);
    const response = await teacherStats();
    expect(response.status).toBe(200);
    await expect(json(response)).resolves.toEqual({ classCount: 1, homeworkCount: 2, schedule: [] });
  });
});
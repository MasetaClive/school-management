import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';
import { StudentController } from '@/modules/students/student.controller';

jest.mock('@/modules/students/student.controller', () => ({
  StudentController: {
    list: jest.fn(),
    create: jest.fn(),
  },
}));

describe('Admin Students API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('delegates to StudentController.list', async () => {
      const response = NextResponse.json({
          data: [],
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        }, { status: 200 });

      jest.mocked(StudentController.list).mockResolvedValue(response);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/students?page=1'
      );

      const result = await GET(request);

      expect(StudentController.list).toHaveBeenCalledWith(request);
      expect(result).toBe(response);
    });
  });

  describe('POST', () => {
    it('delegates to StudentController.create', async () => {
      const response = NextResponse.json({
          profile: {
            id: 'student-1',
            full_name: 'John Doe',
          },
          account: null,
        }, { status: 201 });

      jest.mocked(StudentController.create).mockResolvedValue(response);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/students',
        {
          method: 'POST',
          body: JSON.stringify({
            student_id: 'STU001',
            full_name: 'John Doe',
            academic_year: '2026',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await POST(request);

      expect(StudentController.create).toHaveBeenCalledWith(request);
      expect(result).toBe(response);
    });
  });
});
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
  createStudentSchema,
  updateStudentSchema,
  listStudentsQuerySchema,
} from './student.validation';
import { StudentService, StudentServiceError } from './student.service';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function ensureAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('Unauthorized', 401);

  const role = await getUserRole();
  if (role !== 'admin') throw new ApiError('Forbidden', 403);
}

function toJsonError(e: unknown) {
  if (e instanceof ApiError || e instanceof StudentServiceError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
    return NextResponse.json({ error: (e as any).message }, { status: 400 });
  }
  // eslint-disable-next-line no-console
  console.error('[students] unexpected error', e);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 },
  );
}

export const StudentController = {
  async list(req: NextRequest) {
    try {
      await ensureAdmin();

      const url = new URL(req.url);
      const query = listStudentsQuerySchema.parse({
        page: url.searchParams.get('page') ?? undefined,
        search: url.searchParams.get('search') ?? undefined,
        class_id: url.searchParams.get('class_id') ?? undefined,
        academic_year: url.searchParams.get('academic_year') ?? undefined,
      });

      const result = await StudentService.listStudents(query);
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      return toJsonError(e);
    }
  },

  async create(req: NextRequest) {
    try {
      await ensureAdmin();
      const body = await req.json();
      const input = createStudentSchema.parse(body);

      const student = await StudentService.createStudent(input);
      return NextResponse.json(student, { status: 201 });
    } catch (e) {
      return toJsonError(e);
    }
  },

  async getOne(req: NextRequest, id: string) {
    try {
      await ensureAdmin();
      const student = await StudentService.getStudentById(id);
      return NextResponse.json(student, { status: 200 });
    } catch (e) {
      return toJsonError(e);
    }
  },

  async update(req: NextRequest, id: string) {
    try {
      await ensureAdmin();
      const body = await req.json();
      const input = updateStudentSchema.parse(body);

      const student = await StudentService.updateStudent(id, input);
      return NextResponse.json(student, { status: 200 });
    } catch (e) {
      return toJsonError(e);
    }
  },

  async delete(req: NextRequest, id: string) {
    try {
      await ensureAdmin();

      const result = await StudentService.deleteStudent(id);
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      return toJsonError(e);
    }
  },
};


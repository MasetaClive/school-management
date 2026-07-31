import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { ExamService, ExamServiceError } from '@/modules/exams/exam.service';
import { createExamSchema, listExamsQuerySchema } from '@/modules/exams/exam.validation';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const role = await getUserRole();

    if (!user || role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await TeacherService.getTeacherByUserId(user.id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher record not found' }, { status: 404 });
    }

    const url = new URL(req.url);
    const query = listExamsQuerySchema.parse({
      ...Object.fromEntries(url.searchParams),
      page: url.searchParams.get('page') ?? undefined,
    });

    query.teacher_id = teacher.id;
    const data = await ExamService.listExams(query);
    return NextResponse.json(data);
  } catch (e) {
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
      return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const role = await getUserRole();

    if (!user || role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await TeacherService.getTeacherByUserId(user.id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher record not found' }, { status: 404 });
    }

    const body = await req.json();
    body.teacher_id = teacher.id;
    const valid = createExamSchema.parse(body);
    const data = await ExamService.createExam(valid);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    if (e instanceof ExamServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
      return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { ExamService, ExamServiceError } from '@/modules/exams/exam.service';
import { examIdParamSchema, updateExamSchema } from '@/modules/exams/exam.validation';

async function verifyOwnership(examId: string, teacherId: string) {
  const exam = await ExamService.getExamById(examId);
  if (exam.teacher_id !== teacherId) {
    throw new Error('Forbidden');
  }
  return exam;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const examId = examIdParamSchema.parse(id);
    const exam = await verifyOwnership(examId, teacher.id);
    return NextResponse.json(exam);
  } catch (e) {
    if (e instanceof Error && e.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (e instanceof ExamServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const examId = examIdParamSchema.parse(id);
    await verifyOwnership(examId, teacher.id);

    const body = await req.json();
    body.teacher_id = teacher.id;
    const valid = updateExamSchema.parse(body);
    const updated = await ExamService.updateExam(examId, valid);
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (e instanceof ExamServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
      return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const examId = examIdParamSchema.parse(id);
    await verifyOwnership(examId, teacher.id);

    await ExamService.deleteExam(examId);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (e instanceof ExamServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

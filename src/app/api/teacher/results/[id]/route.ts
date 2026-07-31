import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { ResultService, ResultServiceError } from '@/modules/results/result.service';
import { resultIdParamSchema, updateResultSchema } from '@/modules/results/result.validation';
import { createClient } from '@/lib/supabase/server';

async function canAccessResult(teacherId: string, resultId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('results').select('exam_id').eq('id', resultId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Not found');
  const { data: exam, error: examError } = await supabase.from('exams').select('teacher_id').eq('id', data.exam_id).maybeSingle();
  if (examError) throw examError;
  if (!exam || exam.teacher_id !== teacherId) throw new Error('Forbidden');
  return true;
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
    const resultId = resultIdParamSchema.parse(id);
    await canAccessResult(teacher.id, resultId);
    const result = await ResultService.getResultById(resultId);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (e instanceof ResultServiceError) {
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
    const resultId = resultIdParamSchema.parse(id);
    await canAccessResult(teacher.id, resultId);

    const body = await req.json();
    const valid = updateResultSchema.parse(body);
    const updated = await ResultService.updateResult(resultId, valid);
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Error && e.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (e instanceof ResultServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
      return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

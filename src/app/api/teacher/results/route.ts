import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { ResultService, ResultServiceError } from '@/modules/results/result.service';
import { createResultSchema, listResultsQuerySchema } from '@/modules/results/result.validation';
import { createClient } from '@/lib/supabase/server';

async function canAccessExam(teacherId: string, examId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('exams').select('teacher_id').eq('id', examId).maybeSingle();
  if (error) throw error;
  if (!data || data.teacher_id !== teacherId) throw new Error('Forbidden');
  return true;
}

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
    const query = listResultsQuerySchema.parse({
      ...Object.fromEntries(url.searchParams),
      page: url.searchParams.get('page') ?? undefined,
    });

    if (query.exam_id) {
      await canAccessExam(teacher.id, query.exam_id);
    }

    const data = await ResultService.listResults(query);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Error && e.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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
    if (body.exam_id) await canAccessExam(teacher.id, body.exam_id);
    const valid = createResultSchema.parse(body);
    const data = await ResultService.createResult(valid);
    return NextResponse.json(data, { status: 201 });
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

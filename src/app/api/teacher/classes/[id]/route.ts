import { NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const supabase = await createClient();

    const isAssigned = await supabase
      .from('subject_assignments')
      .select('id')
      .eq('teacher_id', teacher.id)
      .eq('class_id', id)
      .limit(1);

    const isHomeroom = await supabase
      .from('class_teachers')
      .select('id')
      .eq('teacher_id', teacher.id)
      .eq('class_id', id)
      .limit(1);

    if ((isAssigned.data?.length ?? 0) === 0 && (isHomeroom.data?.length ?? 0) === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        academic_year,
        grade_level,
        students(count)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    return NextResponse.json({ data });
  } catch (e) {
    console.error('[teacher/classes/[id]] error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

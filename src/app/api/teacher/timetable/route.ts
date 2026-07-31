import { NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('timetable_entries')
      .select(`
        id,
        academic_year,
        class:classes(id, name, academic_year),
        subject:subjects(id, name, code),
        time_slot:time_slots(id, start_time, end_time, day_of_week)
      `)
      .eq('teacher_id', teacher.id)
      .order('time_slot.day_of_week', { ascending: true })
      .order('time_slot.start_time', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (e) {
    console.error('[teacher/timetable] error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

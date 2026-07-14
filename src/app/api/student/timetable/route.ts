import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get student profile to find class_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('class_id')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // 2. Fetch timetable entries for this class
    const { data, error } = await supabase
      .from('timetable_entries')
      .select(`
        id,
        subject:subjects(name, code),
        time_slot:time_slots(start_time, end_time, day_of_week)
      `)
      .eq('class_id', student.class_id);

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('[student_timetable_api] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

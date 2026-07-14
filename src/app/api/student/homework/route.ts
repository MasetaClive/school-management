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

    // 2. Fetch homework for this class
    const { data, error } = await supabase
      .from('homework')
      .select(`
        *,
        subject:subjects(name, code),
        teacher:teachers(full_name)
      `)
      .eq('class_id', student.class_id)
      .order('due_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('[student_homework_api] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

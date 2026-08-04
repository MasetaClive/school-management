import { NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const role = await getUserRole();

    if (!user || role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (parentError) throw parentError;
    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const { data: children, error: childrenError } = await supabase
      .from('students')
      .select('id, full_name, student_id')
      .eq('parent_id', parent.id)
      .order('full_name');

    if (childrenError) throw childrenError;

    if (!children || children.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const childIds = children.map((child: { id: string }) => child.id);

    const { data, error } = await supabase
      .from('results')
      .select(`
        id,
        score,
        grade,
        student_id,
        exam:exams(name, exam_date),
        subject:subjects(name, code)
      `)
      .in('student_id', childIds)
      .order('id', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

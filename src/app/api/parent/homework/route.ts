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
      .select('class_id')
      .eq('parent_id', parent.id);

    if (childrenError) throw childrenError;

    const classIds = Array.from(
      new Set((children ?? []).map((child: { class_id: string | null }) => child.class_id).filter(Boolean) as string[])
    );

    if (classIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabase
      .from('homework')
      .select(`
        id,
        title,
        description,
        due_date,
        attachment_url,
        subject:subjects(name, code),
        teacher:teachers(full_name)
      `)
      .in('class_id', classIds)
      .order('due_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

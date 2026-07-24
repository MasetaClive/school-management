import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { createClient } from '@/lib/supabase/server';

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

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('class_id');
        if (!classId) {
            return NextResponse.json({ error: 'class_id is required' }, { status: 400 });
        }

        const supabase = await createClient();

        const { data: subjectAssignments, error } = await supabase
            .from('subject_assignments')
            .select('subject_id, subjects:subjects(id, name, code)')
            .eq('teacher_id', teacher.id)
            .eq('class_id', classId);

        if (error) {
            throw error;
        }

        const subjectsMap = new Map<string, { id: string; name: string; code: string }>();
        subjectAssignments?.forEach(item => {
            if (item.subjects) {
                const sub = item.subjects as any;
                subjectsMap.set(sub.id, { id: sub.id, name: sub.name, code: sub.code });
            }
        });

        const list = Array.from(subjectsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ data: list });
    } catch (e) {
        console.error('[teacher/subjects] error', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

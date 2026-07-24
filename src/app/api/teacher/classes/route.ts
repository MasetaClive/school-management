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

        // Query classes from subject assignments
        const { data: subjectAssignments, error: saError } = await supabase
            .from('subject_assignments')
            .select('class_id, classes:classes(id, name, academic_year)')
            .eq('teacher_id', teacher.id);

        if (saError) {
            throw saError;
        }

        // Query classes from class teachers (homeroom)
        const { data: classTeachers, error: ctError } = await supabase
            .from('class_teachers')
            .select('class_id, classes:classes(id, name, academic_year)')
            .eq('teacher_id', teacher.id);

        if (ctError) {
            throw ctError;
        }

        // Merge and deduplicate classes
        const classesMap = new Map<string, { id: string; name: string; academic_year: string }>();

        subjectAssignments?.forEach(item => {
            if (item.classes) {
                const cls = item.classes as any;
                classesMap.set(cls.id, { id: cls.id, name: cls.name, academic_year: cls.academic_year });
            }
        });

        classTeachers?.forEach(item => {
            if (item.classes) {
                const cls = item.classes as any;
                classesMap.set(cls.id, { id: cls.id, name: cls.name, academic_year: cls.academic_year });
            }
        });

        const list = Array.from(classesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ data: list });
    } catch (e) {
        console.error('[teacher/classes] error', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

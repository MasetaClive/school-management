import { NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';

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

        return NextResponse.json({ teacher });
    } catch (e) {
        console.error('[teacher/profile] error', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

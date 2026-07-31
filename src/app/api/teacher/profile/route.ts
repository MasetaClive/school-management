import { NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { updateTeacherSchema } from '@/modules/teachers/teacher.validation';

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

export async function PUT(req: Request) {
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
        const parsed = updateTeacherSchema.parse(body);
        const updatedTeacher = await TeacherService.updateTeacher(teacher.id, parsed);

        return NextResponse.json({ teacher: updatedTeacher });
    } catch (e) {
        console.error('[teacher/profile PUT] error', e);
        if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
            return NextResponse.json({ error: (e as any).message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

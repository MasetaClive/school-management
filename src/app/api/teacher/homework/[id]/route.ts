import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { HomeworkService, HomeworkServiceError } from '@/modules/homework/homework.service';
import { updateHomeworkSchema, homeworkIdParamSchema } from '@/modules/homework/homework.validation';

async function checkOwnership(homeworkId: string, teacherId: string) {
    const homework = await HomeworkService.getHomeworkById(homeworkId);
    if (homework.teacher_id !== teacherId) {
        throw new Error('Forbidden');
    }
    return homework;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        const homeworkId = homeworkIdParamSchema.parse(id);
        const homework = await checkOwnership(homeworkId, teacher.id);

        return NextResponse.json(homework);
    } catch (e) {
        console.error('[teacher/homework/[id] GET] error', e);
        if (e instanceof Error && e.message === 'Forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (e instanceof HomeworkServiceError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        const homeworkId = homeworkIdParamSchema.parse(id);
        await checkOwnership(homeworkId, teacher.id);

        const body = await req.json();
        // Overwrite or force teacher_id in updates just in case
        body.teacher_id = teacher.id;

        const valid = updateHomeworkSchema.parse(body);
        const updated = await HomeworkService.updateHomework(homeworkId, valid);

        return NextResponse.json(updated);
    } catch (e) {
        console.error('[teacher/homework/[id] PATCH] error', e);
        if (e instanceof Error && e.message === 'Forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (e instanceof HomeworkServiceError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
            return NextResponse.json({ error: (e as any).message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        const homeworkId = homeworkIdParamSchema.parse(id);
        await checkOwnership(homeworkId, teacher.id);

        await HomeworkService.deleteHomework(homeworkId);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('[teacher/homework/[id] DELETE] error', e);
        if (e instanceof Error && e.message === 'Forbidden') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (e instanceof HomeworkServiceError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

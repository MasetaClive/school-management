import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { HomeworkService, HomeworkServiceError } from '@/modules/homework/homework.service';
import { createHomeworkSchema, listHomeworkQuerySchema } from '@/modules/homework/homework.validation';

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

        const url = new URL(req.url);
        const query = listHomeworkQuerySchema.parse({
            ...Object.fromEntries(url.searchParams),
            page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
        });

        // Enforce the current teacher constraint!
        query.teacher_id = teacher.id;

        const data = await HomeworkService.listHomework(query);
        return NextResponse.json(data);
    } catch (e) {
        console.error('[teacher/homework GET] error', e);
        if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
            return NextResponse.json({ error: (e as any).message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
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
        // Overwrite teacher_id to enforce security!
        body.teacher_id = teacher.id;

        const valid = createHomeworkSchema.parse(body);
        const data = await HomeworkService.createHomework(valid);
        return NextResponse.json(data, { status: 201 });
    } catch (e) {
        console.error('[teacher/homework POST] error', e);
        if (e instanceof HomeworkServiceError) {
            return NextResponse.json({ error: e.message }, { status: e.status });
        }
        if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
            return NextResponse.json({ error: (e as any).message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

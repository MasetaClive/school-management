import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { HomeworkService, HomeworkServiceError } from './homework.service';
import { createHomeworkSchema, updateHomeworkSchema, listHomeworkQuerySchema, homeworkIdParamSchema } from './homework.validation';

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function ensureRole(allowedRoles: string[]) {
    const user = await getCurrentUser();
    if (!user) throw new ApiError('Unauthorized', 401);

    const role = await getUserRole();
    if (!role || !allowedRoles.includes(role)) throw new ApiError('Forbidden', 403);
    return { user, role };
}

function toJsonError(e: unknown) {
    if (e instanceof ApiError || e instanceof HomeworkServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
    console.error('[homework] unexpected error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export const HomeworkController = {
    async create(req: NextRequest) {
        try {
            await ensureRole(['admin', 'teacher']);
            const body = await req.json();
            const valid = createHomeworkSchema.parse(body);
            const data = await HomeworkService.createHomework(valid);
            return NextResponse.json(data, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async list(req: NextRequest) {
        try {
            await ensureRole(['admin', 'teacher', 'student', 'parent']);
            const url = new URL(req.url);
            const query = listHomeworkQuerySchema.parse(Object.fromEntries(url.searchParams));
            const data = await HomeworkService.listHomework(query);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getById(req: NextRequest, id: string) {
        try {
            await ensureRole(['admin', 'teacher', 'student', 'parent']);
            const data = await HomeworkService.getHomeworkById(homeworkIdParamSchema.parse(id));
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async update(req: NextRequest, id: string) {
        try {
            await ensureRole(['admin', 'teacher']);
            const homeworkId = homeworkIdParamSchema.parse(id);
            const body = await req.json();
            const valid = updateHomeworkSchema.parse(body);
            const data = await HomeworkService.updateHomework(homeworkId, valid);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async delete(req: NextRequest, id: string) {
        try {
            await ensureRole(['admin', 'teacher']);
            const data = await HomeworkService.deleteHomework(homeworkIdParamSchema.parse(id));
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    }
};

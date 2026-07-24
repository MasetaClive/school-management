import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
    createClassTeacherSchema,
    updateClassTeacherSchema,
    listClassTeachersQuerySchema,
    classTeacherIdParamSchema,
} from './classTeacher.validation';
import { ClassTeacherService, ClassTeacherServiceError } from './classTeacher.service';

class ApiError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

function toJsonError(e: unknown) {
    if (e instanceof ClassTeacherServiceError || e instanceof ApiError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
        return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

async function ensureAdmin() {
    const user = await getCurrentUser();
    if (!user) throw new ApiError('Unauthorized', 401);
    const role = await getUserRole();
    if (role !== 'admin') throw new ApiError('Forbidden', 403);
    return user;
}

export const ClassTeacherController = {
    async list(req: NextRequest) {
        try {
            await ensureAdmin();
            const url = new URL(req.url);
            const queryParams = Object.fromEntries(url.searchParams.entries());
            const query = listClassTeachersQuerySchema.parse(queryParams);

            const result = await ClassTeacherService.getClassTeachers(query);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getById(req: NextRequest, { params }: { params: { id: string } }) {
        try {
            await ensureAdmin();
            const assignment = await ClassTeacherService.getClassTeacherById(classTeacherIdParamSchema.parse(params.id));
            return NextResponse.json(assignment, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async create(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = createClassTeacherSchema.parse(body);

            const assignment = await ClassTeacherService.createClassTeacher(input);
            return NextResponse.json({ data: assignment }, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async update(req: NextRequest, { params }: { params: { id: string } }) {
        try {
            await ensureAdmin();
            const assignmentId = classTeacherIdParamSchema.parse(params.id);
            const body = await req.json();
            const input = updateClassTeacherSchema.parse(body);

            const assignment = await ClassTeacherService.updateClassTeacher(assignmentId, input);
            return NextResponse.json({ data: assignment }, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async delete(req: NextRequest, { params }: { params: { id: string } }) {
        try {
            await ensureAdmin();
            await ClassTeacherService.deleteClassTeacher(classTeacherIdParamSchema.parse(params.id));
            return NextResponse.json({ success: true }, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },
};

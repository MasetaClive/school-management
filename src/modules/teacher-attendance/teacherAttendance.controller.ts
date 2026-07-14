import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
    createTeacherAttendanceSchema,
    updateTeacherAttendanceSchema,
    listTeacherAttendanceQuerySchema,
} from './teacherAttendance.validation';
import { TeacherAttendanceService, TeacherAttendanceServiceError } from './teacherAttendance.service';

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function ensureAdmin() {
    const user = await getCurrentUser();
    if (!user) throw new ApiError('Unauthorized', 401);

    const role = await getUserRole();
    if (role !== 'admin') throw new ApiError('Forbidden', 403);
}

function toJsonError(e: unknown) {
    if (e instanceof ApiError || e instanceof TeacherAttendanceServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
        return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    // eslint-disable-next-line no-console
    console.error('[teacher-attendance] unexpected error', e);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
    );
}

export const TeacherAttendanceController = {
    async list(req: NextRequest) {
        try {
            await ensureAdmin();

            const url = new URL(req.url);
            const query = listTeacherAttendanceQuerySchema.parse({
                page: url.searchParams.get('page') ?? undefined,
                teacher_id: url.searchParams.get('teacher_id') ?? undefined,
                date: url.searchParams.get('date') ?? undefined,
            });

            const result = await TeacherAttendanceService.listAttendance(query);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async create(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = createTeacherAttendanceSchema.parse(body);

            const record = await TeacherAttendanceService.createAttendance(input);
            return NextResponse.json(record, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getOne(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const record = await TeacherAttendanceService.getAttendanceById(id);
            return NextResponse.json(record, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async update(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = updateTeacherAttendanceSchema.parse(body);

            const record = await TeacherAttendanceService.updateAttendance(id, input);
            return NextResponse.json(record, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async delete(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const result = await TeacherAttendanceService.deleteAttendance(id);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },
};

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
    createStudentAttendanceSchema,
    updateStudentAttendanceSchema,
    listStudentAttendanceQuerySchema,
} from './studentAttendance.validation';
import { StudentAttendanceService, StudentAttendanceServiceError } from './studentAttendance.service';

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
    if (e instanceof ApiError || e instanceof StudentAttendanceServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
        return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    // eslint-disable-next-line no-console
    console.error('[student-attendance] unexpected error', e);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
    );
}

export const StudentAttendanceController = {
    async list(req: NextRequest) {
        try {
            await ensureAdmin();

            const url = new URL(req.url);
            const query = listStudentAttendanceQuerySchema.parse({
                page: url.searchParams.get('page') ?? undefined,
                student_id: url.searchParams.get('student_id') ?? undefined,
                class_id: url.searchParams.get('class_id') ?? undefined,
                date: url.searchParams.get('date') ?? undefined,
            });

            const result = await StudentAttendanceService.listAttendance(query);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async create(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = createStudentAttendanceSchema.parse(body);

            const record = await StudentAttendanceService.createAttendance(input);
            return NextResponse.json(record, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getOne(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const record = await StudentAttendanceService.getAttendanceById(id);
            return NextResponse.json(record, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async update(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = updateStudentAttendanceSchema.parse(body);

            const record = await StudentAttendanceService.updateAttendance(id, input);
            return NextResponse.json(record, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async delete(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const result = await StudentAttendanceService.deleteAttendance(id);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },
};

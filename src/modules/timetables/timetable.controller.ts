import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
    createTimetableSchema,
    updateTimetableSchema,
    listTimetablesQuerySchema,
    timetableIdParamSchema,
} from './timetable.validation';
import { TimetableService, TimetableServiceError } from './timetable.service';

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
    if (e instanceof ApiError || e instanceof TimetableServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
        return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    console.error('[timetables] unexpected error', e);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
    );
}

export const TimetableController = {
    async list(req: NextRequest) {
        try {
            await ensureAdmin();

            const url = new URL(req.url);
            const query = listTimetablesQuerySchema.parse({
                page: url.searchParams.get('page') ?? undefined,
                class_id: url.searchParams.get('class_id') ?? undefined,
                teacher_id: url.searchParams.get('teacher_id') ?? undefined,
                subject_id: url.searchParams.get('subject_id') ?? undefined,
                time_slot_id: url.searchParams.get('time_slot_id') ?? undefined,
                academic_year: url.searchParams.get('academic_year') ?? undefined,
                day_of_week: url.searchParams.get('day_of_week') ?? undefined,
                search: url.searchParams.get('search') ?? undefined,
            });

            const result = await TimetableService.listTimetables(query);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async create(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = createTimetableSchema.parse(body);

            const entry = await TimetableService.createTimetableEntry(input);
            return NextResponse.json(entry, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getOne(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const entry = await TimetableService.getTimetableById(timetableIdParamSchema.parse(id));
            return NextResponse.json(entry, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async update(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const entryId = timetableIdParamSchema.parse(id);
            const body = await req.json();
            const input = updateTimetableSchema.parse(body);

            const entry = await TimetableService.updateTimetableEntry(entryId, input);
            return NextResponse.json(entry, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async delete(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const result = await TimetableService.deleteTimetableEntry(timetableIdParamSchema.parse(id));
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getSlots(req: NextRequest) {
        try {
            await ensureAdmin();
            const slots = await TimetableService.getTimeSlots();
            return NextResponse.json({ data: slots }, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    }
};

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
    createClassSchema,
    updateClassSchema,
    listClassesQuerySchema,
    classIdParamSchema,
} from './class.validation';
import { ClassService, ClassServiceError } from './class.service';

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
    if (e instanceof ApiError || e instanceof ClassServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
        return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    // eslint-disable-next-line no-console
    console.error('[classes] unexpected error', e);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
    );
}

export const ClassController = {
    async list(req: NextRequest) {
        try {
            await ensureAdmin();

            const url = new URL(req.url);
            const query = listClassesQuerySchema.parse({
                page: url.searchParams.get('page') ?? undefined,
                search: url.searchParams.get('search') ?? undefined,
            });

            const result = await ClassService.listClasses(query);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async create(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = createClassSchema.parse(body);

            const classData = await ClassService.createClass(input);
            return NextResponse.json(classData, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getOne(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const classData = await ClassService.getClassById(classIdParamSchema.parse(id));
            return NextResponse.json(classData, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async update(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = updateClassSchema.parse(body);

            const classData = await ClassService.updateClass(classIdParamSchema.parse(id), input);
            return NextResponse.json(classData, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async delete(req: NextRequest, id: string) {
        try {
            await ensureAdmin();

            const result = await ClassService.deleteClass(classIdParamSchema.parse(id));
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },
};

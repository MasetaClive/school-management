import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
    createSubjectSchema,
    updateSubjectSchema,
    listSubjectsQuerySchema,
    subjectIdParamSchema,
} from './subject.validation';
import { SubjectService, SubjectServiceError } from './subject.service';

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
    if (e instanceof ApiError || e instanceof SubjectServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
        return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    console.error('[subjects] unexpected error', e);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
    );
}

export const SubjectController = {
    async list(req: NextRequest) {
        try {
            await ensureAdmin();

            const url = new URL(req.url);
            const query = listSubjectsQuerySchema.parse({
                page: url.searchParams.get('page') ?? undefined,
                search: url.searchParams.get('search') ?? undefined,
            });

            const result = await SubjectService.listSubjects(query);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async create(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = createSubjectSchema.parse(body);

            const subject = await SubjectService.createSubject(input);
            return NextResponse.json(subject, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getOne(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const subject = await SubjectService.getSubjectById(subjectIdParamSchema.parse(id));
            return NextResponse.json(subject, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async update(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = updateSubjectSchema.parse(body);

            const subject = await SubjectService.updateSubject(subjectIdParamSchema.parse(id), input);
            return NextResponse.json(subject, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async delete(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const result = await SubjectService.deleteSubject(subjectIdParamSchema.parse(id));
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },
};

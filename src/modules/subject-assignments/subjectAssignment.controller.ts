import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
    createSubjectAssignmentSchema,
    updateSubjectAssignmentSchema,
    listSubjectAssignmentsQuerySchema,
    subjectAssignmentIdParamSchema,
} from './subjectAssignment.validation';
import {
    SubjectAssignmentService,
    SubjectAssignmentServiceError,
} from './subjectAssignment.service';

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
    if (e instanceof ApiError || e instanceof SubjectAssignmentServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
        return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    console.error('[subject-assignments] unexpected error', e);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
    );
}

export const SubjectAssignmentController = {
    async list(req: NextRequest) {
        try {
            await ensureAdmin();

            const url = new URL(req.url);
            const query = listSubjectAssignmentsQuerySchema.parse({
                page: url.searchParams.get('page') ?? undefined,
                teacher_id: url.searchParams.get('teacher_id') ?? undefined,
                class_id: url.searchParams.get('class_id') ?? undefined,
                subject_id: url.searchParams.get('subject_id') ?? undefined,
                search: url.searchParams.get('search') ?? undefined,
            });

            const result = await SubjectAssignmentService.listSubjectAssignments(query);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async create(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = createSubjectAssignmentSchema.parse(body);

            const assignment = await SubjectAssignmentService.createSubjectAssignment(input);
            return NextResponse.json(assignment, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getOne(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const assignment = await SubjectAssignmentService.getSubjectAssignmentById(subjectAssignmentIdParamSchema.parse(id));
            return NextResponse.json(assignment, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async update(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const assignmentId = subjectAssignmentIdParamSchema.parse(id);
            const body = await req.json();
            const input = updateSubjectAssignmentSchema.parse(body);

            const assignment = await SubjectAssignmentService.updateSubjectAssignment(assignmentId, input);
            return NextResponse.json(assignment, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async delete(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const result = await SubjectAssignmentService.deleteSubjectAssignment(subjectAssignmentIdParamSchema.parse(id));
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },
};

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
    createParentSchema,
    updateParentSchema,
    listParentsQuerySchema,
    parentIdParamSchema,
} from './parent.validation';
import { ParentService, ParentServiceError } from './parent.service';
import { UserServiceError } from '@/modules/users/user.service';

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
    if (e instanceof ApiError || e instanceof ParentServiceError || e instanceof UserServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
        return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    // eslint-disable-next-line no-console
    console.error('[parents] unexpected error', e);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
    );
}

export const ParentController = {
    async list(req: NextRequest) {
        try {
            await ensureAdmin();

            const url = new URL(req.url);
            const query = listParentsQuerySchema.parse({
                page: url.searchParams.get('page') ?? undefined,
                search: url.searchParams.get('search') ?? undefined,
            });

            const result = await ParentService.listParents(query);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async create(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = createParentSchema.parse(body);

            const parent = await ParentService.createParent(input);
            return NextResponse.json(parent, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getOne(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const parent = await ParentService.getParentById(parentIdParamSchema.parse(id));
            return NextResponse.json(parent, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async update(req: NextRequest, id: string) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const input = updateParentSchema.parse(body);

            const parent = await ParentService.updateParent(parentIdParamSchema.parse(id), input);
            return NextResponse.json(parent, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async delete(req: NextRequest, id: string) {
        try {
            await ensureAdmin();

            const result = await ParentService.deleteParent(parentIdParamSchema.parse(id));
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },
};

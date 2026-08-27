import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
    createMessageSchema,
    listMessagesQuerySchema,
} from './message.validation';
import { MessageService, MessageServiceError } from './message.service';

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function ensureAuthenticated() {
    const user = await getCurrentUser();
    if (!user) throw new ApiError('Unauthorized', 401);
    return user;
}

function toJsonError(e: unknown) {
    if (e instanceof ApiError || e instanceof MessageServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
        return NextResponse.json({ error: (e as any).message }, { status: 400 });
    }
    console.error('[messages] unexpected error', e);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
    );
}

export const MessageController = {
    async getInbox(req: NextRequest) {
        try {
            const user = await ensureAuthenticated();

            const url = new URL(req.url);
            const query = listMessagesQuerySchema.parse({
                page: url.searchParams.get('page') ?? undefined,
            });

            const result = await MessageService.getInbox(user.id, query);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getSent(req: NextRequest) {
        try {
            const user = await ensureAuthenticated();

            const url = new URL(req.url);
            const query = listMessagesQuerySchema.parse({
                page: url.searchParams.get('page') ?? undefined,
            });

            const result = await MessageService.getSentMessages(user.id, query);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async create(req: NextRequest) {
        try {
            const user = await ensureAuthenticated();
            const body = await req.json();
            const input = createMessageSchema.parse(body);

            const record = await MessageService.sendMessage(user.id, input);
            return NextResponse.json(record, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getOne(req: NextRequest, id: string) {
        try {
            const user = await ensureAuthenticated();
            const record = await MessageService.getMessageById(id, user.id);
            return NextResponse.json(record, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async markAsRead(req: NextRequest, id: string) {
        try {
            const user = await ensureAuthenticated();
            const result = await MessageService.markAsRead(id, user.id);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async delete(req: NextRequest, id: string) {
        try {
            const user = await ensureAuthenticated();
            const result = await MessageService.deleteMessage(id, user.id);
            return NextResponse.json(result, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async listUsers(req: NextRequest) {
        try {
            await ensureAuthenticated();
            const role = await getUserRole();
            if (!role) throw new ApiError('Forbidden', 403);

            const url = new URL(req.url);
            const search = url.searchParams.get('search') || undefined;

            const users = await MessageService.listUsers(role, search);
            return NextResponse.json(users, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },
};

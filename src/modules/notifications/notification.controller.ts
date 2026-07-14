import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { NotificationService, NotificationServiceError } from './notification.service';

function toJsonError(e: unknown) {
    if (e instanceof NotificationServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[notifications] unexpected error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export const NotificationController = {
    async list(req: NextRequest) {
        try {
            const user = await getCurrentUser();
            if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const data = await NotificationService.listForUser(user.email);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async markRead(req: NextRequest, { params }: { params: { id: string } }) {
        try {
            const user = await getCurrentUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const data = await NotificationService.markAsRead(params.id);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    }
};

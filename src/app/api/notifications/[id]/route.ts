import { NextRequest } from 'next/server';
import { NotificationRoutes } from '@/modules/notifications/notification.routes';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return NotificationRoutes.MARK_READ(req, { params: await params });
}

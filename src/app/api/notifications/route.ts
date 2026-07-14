import { NextRequest } from 'next/server';
import { NotificationRoutes } from '@/modules/notifications/notification.routes';

export async function GET(req: NextRequest) {
    return NotificationRoutes.LIST(req);
}

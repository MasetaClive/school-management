import { NextRequest } from 'next/server';
import { NotificationController } from './notification.controller';

export const NotificationRoutes = {
    async LIST(req: NextRequest) {
        return NotificationController.list(req);
    },
    async MARK_READ(req: NextRequest, { params }: { params: { id: string } }) {
        return NotificationController.markRead(req, { params });
    }
};

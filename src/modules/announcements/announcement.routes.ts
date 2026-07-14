import { NextRequest } from 'next/server';
import { AnnouncementController } from './announcement.controller';

export const AnnouncementRoutes = {
    async LIST(req: NextRequest) {
        return AnnouncementController.list(req);
    },
    async CREATE(req: NextRequest) {
        return AnnouncementController.create(req);
    },
    async TOGGLE(req: NextRequest, { params }: { params: { id: string } }) {
        return AnnouncementController.toggle(req, { params });
    }
};

import { NextRequest } from 'next/server';
import { AnnouncementRoutes } from '@/modules/announcements/announcement.routes';

export async function GET(req: NextRequest) {
    return AnnouncementRoutes.LIST(req);
}

export async function POST(req: NextRequest) {
    return AnnouncementRoutes.CREATE(req);
}

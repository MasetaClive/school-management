import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementService, AnnouncementServiceError } from './announcement.service';

function toJsonError(e: unknown) {
    if (e instanceof AnnouncementServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[announcements] unexpected error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export const AnnouncementController = {
    async list(req: NextRequest) {
        try {
            const url = new URL(req.url);
            const all = url.searchParams.get('all') === 'true';
            const data = all ? await AnnouncementService.listAll() : await AnnouncementService.listActive();
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async create(req: NextRequest) {
        try {
            const body = await req.json();
            const data = await AnnouncementService.create(body);
            return NextResponse.json(data, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async toggle(req: NextRequest, { params }: { params: { id: string } }) {
        try {
            const body = await req.json();
            const data = await AnnouncementService.toggleStatus(params.id, body.is_published);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    }
};

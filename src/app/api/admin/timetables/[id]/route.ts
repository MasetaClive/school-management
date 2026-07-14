import {
    getTimetableRoute,
    updateTimetableRoute,
    deleteTimetableRoute,
} from '@/modules/timetables/timetable.routes';
import { NextRequest } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return getTimetableRoute(req, (await params).id);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return updateTimetableRoute(req, (await params).id);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return deleteTimetableRoute(req, (await params).id);
}

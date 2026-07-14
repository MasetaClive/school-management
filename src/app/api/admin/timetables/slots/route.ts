import { getTimeSlotsRoute } from '@/modules/timetables/timetable.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return getTimeSlotsRoute(req);
}

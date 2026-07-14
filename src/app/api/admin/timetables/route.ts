import {
    listTimetablesRoute,
    createTimetableRoute,
} from '@/modules/timetables/timetable.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return listTimetablesRoute(req);
}

export async function POST(req: NextRequest) {
    return createTimetableRoute(req);
}

import {
    listTimeSlotsRoute,
    createTimeSlotRoute,
} from '@/modules/time-slots/timeSlot.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return listTimeSlotsRoute(req);
}

export async function POST(req: NextRequest) {
    return createTimeSlotRoute(req);
}

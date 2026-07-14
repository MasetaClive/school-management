import { NextRequest } from 'next/server';
import { TimetableController } from './timetable.controller';

export async function listTimetablesRoute(req: NextRequest) {
    return TimetableController.list(req);
}

export async function createTimetableRoute(req: NextRequest) {
    return TimetableController.create(req);
}

export async function getTimetableRoute(req: NextRequest, id: string) {
    return TimetableController.getOne(req, id);
}

export async function updateTimetableRoute(req: NextRequest, id: string) {
    return TimetableController.update(req, id);
}

export async function deleteTimetableRoute(req: NextRequest, id: string) {
    return TimetableController.delete(req, id);
}

export async function getTimeSlotsRoute(req: NextRequest) {
    return TimetableController.getSlots(req);
}

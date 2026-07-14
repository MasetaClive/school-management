import { NextRequest } from 'next/server';
import { TimeSlotController } from './timeSlot.controller';

export async function listTimeSlotsRoute(req: NextRequest) {
    return TimeSlotController.list(req);
}

export async function createTimeSlotRoute(req: NextRequest) {
    return TimeSlotController.create(req);
}

export async function getTimeSlotRoute(req: NextRequest, id: string) {
    return TimeSlotController.getOne(req, id);
}

export async function updateTimeSlotRoute(req: NextRequest, id: string) {
    return TimeSlotController.update(req, id);
}

export async function deleteTimeSlotRoute(req: NextRequest, id: string) {
    return TimeSlotController.delete(req, id);
}

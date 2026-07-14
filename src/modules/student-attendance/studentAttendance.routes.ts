import { NextRequest } from 'next/server';
import { StudentAttendanceController } from './studentAttendance.controller';

export async function listStudentAttendanceRoute(req: NextRequest) {
    return StudentAttendanceController.list(req);
}

export async function createStudentAttendanceRoute(req: NextRequest) {
    return StudentAttendanceController.create(req);
}

export async function getStudentAttendanceRoute(req: NextRequest, id: string) {
    return StudentAttendanceController.getOne(req, id);
}

export async function updateStudentAttendanceRoute(req: NextRequest, id: string) {
    return StudentAttendanceController.update(req, id);
}

export async function deleteStudentAttendanceRoute(req: NextRequest, id: string) {
    return StudentAttendanceController.delete(req, id);
}

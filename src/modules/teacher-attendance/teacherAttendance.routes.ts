import { NextRequest } from 'next/server';
import { TeacherAttendanceController } from './teacherAttendance.controller';

export async function listTeacherAttendanceRoute(req: NextRequest) {
    return TeacherAttendanceController.list(req);
}

export async function createTeacherAttendanceRoute(req: NextRequest) {
    return TeacherAttendanceController.create(req);
}

export async function getTeacherAttendanceRoute(req: NextRequest, id: string) {
    return TeacherAttendanceController.getOne(req, id);
}

export async function updateTeacherAttendanceRoute(req: NextRequest, id: string) {
    return TeacherAttendanceController.update(req, id);
}

export async function deleteTeacherAttendanceRoute(req: NextRequest, id: string) {
    return TeacherAttendanceController.delete(req, id);
}

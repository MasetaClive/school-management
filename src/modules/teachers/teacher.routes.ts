import { NextRequest } from 'next/server';
import { TeacherController } from './teacher.controller';

export async function listTeachersRoute(req: NextRequest) {
    return TeacherController.list(req);
}

export async function createTeacherRoute(req: NextRequest) {
    return TeacherController.create(req);
}

export async function getTeacherRoute(req: NextRequest, id: string) {
    return TeacherController.getOne(req, id);
}

export async function updateTeacherRoute(req: NextRequest, id: string) {
    return TeacherController.update(req, id);
}

export async function deleteTeacherRoute(req: NextRequest, id: string) {
    return TeacherController.delete(req, id);
}

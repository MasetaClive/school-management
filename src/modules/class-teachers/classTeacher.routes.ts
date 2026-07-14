import { NextRequest } from 'next/server';
import { ClassTeacherController } from './classTeacher.controller';

export async function listClassTeachersRoute(req: NextRequest) {
    return ClassTeacherController.list(req);
}

export async function createClassTeacherRoute(req: NextRequest) {
    return ClassTeacherController.create(req);
}

export async function getClassTeacherRoute(req: NextRequest, { params }: { params: { id: string } }) {
    return ClassTeacherController.getById(req, { params });
}

export async function updateClassTeacherRoute(req: NextRequest, { params }: { params: { id: string } }) {
    return ClassTeacherController.update(req, { params });
}

export async function deleteClassTeacherRoute(req: NextRequest, { params }: { params: { id: string } }) {
    return ClassTeacherController.delete(req, { params });
}

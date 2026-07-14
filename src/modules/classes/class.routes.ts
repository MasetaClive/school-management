import { NextRequest } from 'next/server';
import { ClassController } from './class.controller';

export async function listClassesRoute(req: NextRequest) {
    return ClassController.list(req);
}

export async function createClassRoute(req: NextRequest) {
    return ClassController.create(req);
}

export async function getClassRoute(req: NextRequest, id: string) {
    return ClassController.getOne(req, id);
}

export async function updateClassRoute(req: NextRequest, id: string) {
    return ClassController.update(req, id);
}

export async function deleteClassRoute(req: NextRequest, id: string) {
    return ClassController.delete(req, id);
}

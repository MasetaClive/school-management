import { NextRequest } from 'next/server';
import { SubjectController } from './subject.controller';

export async function listSubjectsRoute(req: NextRequest) {
    return SubjectController.list(req);
}

export async function createSubjectRoute(req: NextRequest) {
    return SubjectController.create(req);
}

export async function getSubjectRoute(req: NextRequest, id: string) {
    return SubjectController.getOne(req, id);
}

export async function updateSubjectRoute(req: NextRequest, id: string) {
    return SubjectController.update(req, id);
}

export async function deleteSubjectRoute(req: NextRequest, id: string) {
    return SubjectController.delete(req, id);
}

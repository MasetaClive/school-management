import { NextRequest } from 'next/server';
import { SubjectAssignmentController } from './subjectAssignment.controller';

export async function listSubjectAssignmentsRoute(req: NextRequest) {
    return SubjectAssignmentController.list(req);
}

export async function createSubjectAssignmentRoute(req: NextRequest) {
    return SubjectAssignmentController.create(req);
}

export async function getSubjectAssignmentRoute(req: NextRequest, id: string) {
    return SubjectAssignmentController.getOne(req, id);
}

export async function updateSubjectAssignmentRoute(req: NextRequest, id: string) {
    return SubjectAssignmentController.update(req, id);
}

export async function deleteSubjectAssignmentRoute(req: NextRequest, id: string) {
    return SubjectAssignmentController.delete(req, id);
}

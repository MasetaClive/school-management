import { NextRequest } from 'next/server';
import { ExamController } from './exam.controller';

export async function listExamsRoute(req: NextRequest) {
    return ExamController.list(req);
}

export async function createExamRoute(req: NextRequest) {
    return ExamController.create(req);
}

export async function getExamRoute(req: NextRequest, id: string) {
    return ExamController.getOne(req, id);
}

export async function updateExamRoute(req: NextRequest, id: string) {
    return ExamController.update(req, id);
}

export async function deleteExamRoute(req: NextRequest, id: string) {
    return ExamController.delete(req, id);
}

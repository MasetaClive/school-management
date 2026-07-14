import { NextRequest } from 'next/server';
import { ResultController } from './result.controller';

export async function listResultsRoute(req: NextRequest) {
    return ResultController.list(req);
}

export async function createResultRoute(req: NextRequest) {
    return ResultController.create(req);
}

export async function getResultRoute(req: NextRequest, id: string) {
    return ResultController.getOne(req, id);
}

export async function updateResultRoute(req: NextRequest, id: string) {
    return ResultController.update(req, id);
}

export async function deleteResultRoute(req: NextRequest, id: string) {
    return ResultController.delete(req, id);
}

import { NextRequest } from 'next/server';
import { ParentController } from './parent.controller';

export async function listParentsRoute(req: NextRequest) {
    return ParentController.list(req);
}

export async function createParentRoute(req: NextRequest) {
    return ParentController.create(req);
}

export async function getParentRoute(req: NextRequest, id: string) {
    return ParentController.getOne(req, id);
}

export async function updateParentRoute(req: NextRequest, id: string) {
    return ParentController.update(req, id);
}

export async function deleteParentRoute(req: NextRequest, id: string) {
    return ParentController.delete(req, id);
}

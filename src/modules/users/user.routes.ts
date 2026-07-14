import { NextRequest } from 'next/server';
import { UserController } from './user.controller';

export async function listUsersRoute(req: NextRequest) {
  return UserController.list(req);
}

export async function createUserRoute(req: NextRequest) {
  return UserController.create(req);
}

export async function deleteUserRoute(req: NextRequest, id: string) {
  return UserController.delete(req, id);
}

export async function updateUserRoute(req: NextRequest, id: string) {
  return UserController.update(req, id);
}

export async function getUnlinkedEntitiesRoute(req: NextRequest) {
  return UserController.getUnlinked(req);
}

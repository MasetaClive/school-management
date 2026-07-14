import { NextRequest } from 'next/server';
import { StudentController } from './student.controller';

export async function listStudentsRoute(req: NextRequest) {
  return StudentController.list(req);
}

export async function createStudentRoute(req: NextRequest) {
  return StudentController.create(req);
}

export async function getStudentRoute(req: NextRequest, id: string) {
  return StudentController.getOne(req, id);
}

export async function updateStudentRoute(req: NextRequest, id: string) {
  return StudentController.update(req, id);
}

export async function deleteStudentRoute(req: NextRequest, id: string) {
  return StudentController.delete(req, id);
}


import { NextRequest } from 'next/server';
import {
  getStudentRoute,
  updateStudentRoute,
  deleteStudentRoute,
} from '@/modules/students/student.routes';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  return getStudentRoute(req, (await params).id);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return updateStudentRoute(req, (await params).id);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return deleteStudentRoute(req, (await params).id);
}

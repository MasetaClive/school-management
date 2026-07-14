import { NextRequest } from 'next/server';
import {
  listStudentsRoute,
  createStudentRoute,
} from '@/modules/students/student.routes';

export async function GET(req: NextRequest) {
  return listStudentsRoute(req);
}

export async function POST(req: NextRequest) {
  return createStudentRoute(req);
}


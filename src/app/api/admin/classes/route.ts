import {
  listClassesRoute,
  createClassRoute,
} from '@/modules/classes/class.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return listClassesRoute(req);
}

export async function POST(req: NextRequest) {
  return createClassRoute(req);
}

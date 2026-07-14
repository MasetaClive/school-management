import {
  listParentsRoute,
  createParentRoute,
} from '@/modules/parents/parent.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return listParentsRoute(req);
}

export async function POST(req: NextRequest) {
  return createParentRoute(req);
}

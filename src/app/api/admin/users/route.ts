import { NextRequest } from 'next/server';
import {
  listUsersRoute,
  createUserRoute,
} from '@/modules/users/user.routes';

export async function GET(req: NextRequest) {
  return listUsersRoute(req);
}

export async function POST(req: NextRequest) {
  return createUserRoute(req);
}

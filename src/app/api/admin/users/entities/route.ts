import { NextRequest } from 'next/server';
import { getUnlinkedEntitiesRoute } from '@/modules/users/user.routes';

export async function GET(req: NextRequest) {
  return getUnlinkedEntitiesRoute(req);
}

import { getUsersRoute } from '@/modules/messages/message.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return getUsersRoute(req);
}

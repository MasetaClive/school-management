import { getSentRoute } from '@/modules/messages/message.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return getSentRoute(req);
}

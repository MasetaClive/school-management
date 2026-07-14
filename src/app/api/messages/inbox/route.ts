import { getInboxRoute } from '@/modules/messages/message.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return getInboxRoute(req);
}

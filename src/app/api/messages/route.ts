import { createMessageRoute } from '@/modules/messages/message.routes';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    return createMessageRoute(req);
}

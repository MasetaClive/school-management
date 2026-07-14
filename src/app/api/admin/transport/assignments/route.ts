import { NextRequest } from 'next/server';
import { TransportRoutes } from '@/modules/transport/transport.routes';

export async function GET(req: NextRequest) {
    return TransportRoutes.LIST_ASSIGNMENTS(req);
}

export async function POST(req: NextRequest) {
    return TransportRoutes.ASSIGN_STUDENT(req);
}

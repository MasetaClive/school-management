import { NextRequest } from 'next/server';
import { RolloverRoutes } from '@/modules/rollover/rollover.routes';

export async function GET(req: NextRequest) {
    return RolloverRoutes.GET_STUDENTS(req);
}

export async function POST(req: NextRequest) {
    return RolloverRoutes.PROMOTE(req);
}

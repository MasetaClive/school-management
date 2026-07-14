import { NextRequest } from 'next/server';
import { FeesRoutes } from '@/modules/fees/fees.routes';

export async function GET(req: NextRequest) {
    return FeesRoutes.LIST_TYPES(req);
}

export async function POST(req: NextRequest) {
    return FeesRoutes.CREATE_TYPE(req);
}

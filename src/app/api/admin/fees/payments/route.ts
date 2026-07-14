import { NextRequest } from 'next/server';
import { FeesRoutes } from '@/modules/fees/fees.routes';

export async function POST(req: NextRequest) {
    return FeesRoutes.RECORD_PAYMENT(req);
}

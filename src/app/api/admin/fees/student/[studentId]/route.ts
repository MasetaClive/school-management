import { NextRequest } from 'next/server';
import { FeesRoutes } from '@/modules/fees/fees.routes';

type Params = { params: Promise<{ studentId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    const { studentId } = await params;
    return FeesRoutes.GET_STUDENT_FEES(req, { params: { studentId } });
}

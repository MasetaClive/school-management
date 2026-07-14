import { NextRequest } from 'next/server';
import { ReportCardRoutes } from '@/modules/report-cards/reportCard.routes';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ studentId: string }> }
) {
    return ReportCardRoutes.GET_REPORT(req, { params: await params });
}

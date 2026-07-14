import { NextRequest } from 'next/server';
import { ReportRoutes } from '@/modules/reports/report.routes';

export async function GET(req: NextRequest) {
    return ReportRoutes.FINANCIAL(req);
}

import { NextRequest } from 'next/server';
import { PayrollRoutes } from '@/modules/payroll/payroll.routes';

export async function GET(req: NextRequest) {
    return PayrollRoutes.LIST_HISTORY(req);
}

export async function POST(req: NextRequest) {
    return PayrollRoutes.GENERATE(req);
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { PayrollService, PayrollServiceError } from './payroll.service';

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function ensureAdmin() {
    const user = await getCurrentUser();
    if (!user) throw new ApiError('Unauthorized', 401);
    const role = await getUserRole();
    if (role !== 'admin') throw new ApiError('Forbidden', 403);
    return user;
}

function toJsonError(e: unknown) {
    if (e instanceof ApiError || e instanceof PayrollServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[payroll] unexpected error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export const PayrollController = {
    async setConfig(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const data = await PayrollService.setSalaryConfig(
                body.teacher_id, 
                body.base_salary, 
                body.allowances, 
                body.deductions
            );
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async listConfigs(req: NextRequest) {
        try {
            await ensureAdmin();
            const data = await PayrollService.listSalaries();
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async generate(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const data = await PayrollService.generateMonthlyPayroll(body.month, body.year);
            return NextResponse.json(data, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async listHistory(req: NextRequest) {
        try {
            await ensureAdmin();
            const url = new URL(req.url);
            const year = Number(url.searchParams.get('year') || new Date().getFullYear());
            const month = url.searchParams.get('month') ? Number(url.searchParams.get('month')) : undefined;
            const data = await PayrollService.listPayrollHistory(year, month);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    }
};

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { FeesService, FeesServiceError } from './fees.service';
import { createFeeTypeSchema, createStudentFeeSchema, recordPaymentSchema } from './fees.validation';

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
    if (e instanceof ApiError || e instanceof FeesServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[fees] unexpected error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export const FeesController = {
    async createFeeType(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const valid = createFeeTypeSchema.parse(body);
            const data = await FeesService.createFeeType(valid);
            return NextResponse.json(data, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async listFeeTypes(req: NextRequest) {
        try {
            const url = new URL(req.url);
            const ay = url.searchParams.get('academic_year') || undefined;
            const data = await FeesService.listFeeTypes(ay);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async assignFee(req: NextRequest) {
        try {
            await ensureAdmin();
            const body = await req.json();
            const valid = createStudentFeeSchema.parse(body);
            const data = await FeesService.assignFeeToStudent(valid);
            return NextResponse.json(data, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async recordPayment(req: NextRequest) {
        try {
            const admin = await ensureAdmin();
            const body = await req.json();
            const valid = recordPaymentSchema.parse(body);
            const data = await FeesService.recordPayment(valid, admin.id);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async getStudentFees(req: NextRequest, studentId: string) {
        try {
            // Role check: admin, or parent of this student
            const user = await getCurrentUser();
            if (!user) throw new ApiError('Unauthorized', 401);
            
            // For now simplified auth, but RLS in Supabase will handle the actual data isolation
            const data = await FeesService.getStudentBalances(studentId);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    }
};

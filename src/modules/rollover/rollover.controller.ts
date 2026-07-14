import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { RolloverService, RolloverServiceError } from './rollover.service';

function toJsonError(e: unknown) {
    if (e instanceof RolloverServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[rollover] unexpected error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export const RolloverController = {
    async getStudents(req: NextRequest) {
        try {
            const data = await RolloverService.listStudentsForPromotion();
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async promote(req: NextRequest) {
        try {
            const body = await req.json(); // { promotions: [{ student_id, next_class_id }] }
            const data = await RolloverService.promoteStudents(body.promotions);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    }
};

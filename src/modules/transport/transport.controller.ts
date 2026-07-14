import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TransportService, TransportServiceError } from './transport.service';

function toJsonError(e: unknown) {
    if (e instanceof TransportServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[transport] unexpected error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export const TransportController = {
    async listRoutes(req: NextRequest) {
        try {
            const data = await TransportService.listRoutes();
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async createRoute(req: NextRequest) {
        try {
            const body = await req.json();
            const data = await TransportService.createRoute(body);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async assignStudent(req: NextRequest) {
        try {
            const body = await req.json();
            const data = await TransportService.assignStudent(body.student_id, body.route_id, body.details);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async listAssignments(req: NextRequest) {
        try {
            const data = await TransportService.listAssignments();
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    }
};

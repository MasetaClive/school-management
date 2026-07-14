import {
    getResultRoute,
    updateResultRoute,
    deleteResultRoute,
} from '@/modules/results/result.routes';
import { NextRequest } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return getResultRoute(req, (await params).id);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return updateResultRoute(req, (await params).id);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return deleteResultRoute(req, (await params).id);
}

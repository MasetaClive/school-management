import {
    getSubjectRoute,
    updateSubjectRoute,
    deleteSubjectRoute,
} from '@/modules/subjects/subject.routes';
import { NextRequest } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return getSubjectRoute(req, (await params).id);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return updateSubjectRoute(req, (await params).id);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return deleteSubjectRoute(req, (await params).id);
}

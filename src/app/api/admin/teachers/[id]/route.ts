import {
    getTeacherRoute,
    updateTeacherRoute,
    deleteTeacherRoute,
} from '@/modules/teachers/teacher.routes';
import { NextRequest } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return getTeacherRoute(req, (await params).id);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return updateTeacherRoute(req, (await params).id);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return deleteTeacherRoute(req, (await params).id);
}

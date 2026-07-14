import { NextRequest } from 'next/server';
import {
    getClassTeacherRoute,
    updateClassTeacherRoute,
    deleteClassTeacherRoute,
} from '@/modules/class-teachers/classTeacher.routes';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return getClassTeacherRoute(req, { params: await params });
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return updateClassTeacherRoute(req, { params: await params });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return deleteClassTeacherRoute(req, { params: await params });
}

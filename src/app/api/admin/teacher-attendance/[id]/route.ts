import {
    getTeacherAttendanceRoute,
    updateTeacherAttendanceRoute,
    deleteTeacherAttendanceRoute,
} from '@/modules/teacher-attendance/teacherAttendance.routes';
import { NextRequest } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return getTeacherAttendanceRoute(req, (await params).id);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return updateTeacherAttendanceRoute(req, (await params).id);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return deleteTeacherAttendanceRoute(req, (await params).id);
}

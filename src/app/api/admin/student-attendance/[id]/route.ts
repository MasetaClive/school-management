import {
    getStudentAttendanceRoute,
    updateStudentAttendanceRoute,
    deleteStudentAttendanceRoute,
} from '@/modules/student-attendance/studentAttendance.routes';
import { NextRequest } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return getStudentAttendanceRoute(req, (await params).id);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return updateStudentAttendanceRoute(req, (await params).id);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return deleteStudentAttendanceRoute(req, (await params).id);
}

import {
    listTeacherAttendanceRoute,
    createTeacherAttendanceRoute,
} from '@/modules/teacher-attendance/teacherAttendance.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return listTeacherAttendanceRoute(req);
}

export async function POST(req: NextRequest) {
    return createTeacherAttendanceRoute(req);
}

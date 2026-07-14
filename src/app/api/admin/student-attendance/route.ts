import {
    listStudentAttendanceRoute,
    createStudentAttendanceRoute,
} from '@/modules/student-attendance/studentAttendance.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return listStudentAttendanceRoute(req);
}

export async function POST(req: NextRequest) {
    return createStudentAttendanceRoute(req);
}

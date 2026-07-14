import {
    listTeachersRoute,
    createTeacherRoute,
} from '@/modules/teachers/teacher.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return listTeachersRoute(req);
}

export async function POST(req: NextRequest) {
    return createTeacherRoute(req);
}

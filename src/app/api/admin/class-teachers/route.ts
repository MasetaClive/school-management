import { NextRequest } from 'next/server';
import {
    listClassTeachersRoute,
    createClassTeacherRoute,
} from '@/modules/class-teachers/classTeacher.routes';

export async function GET(req: NextRequest) {
    return listClassTeachersRoute(req);
}

export async function POST(req: NextRequest) {
    return createClassTeacherRoute(req);
}

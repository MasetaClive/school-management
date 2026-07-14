import {
    listSubjectsRoute,
    createSubjectRoute,
} from '@/modules/subjects/subject.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return listSubjectsRoute(req);
}

export async function POST(req: NextRequest) {
    return createSubjectRoute(req);
}

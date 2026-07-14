import {
    listExamsRoute,
    createExamRoute,
} from '@/modules/exams/exam.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return listExamsRoute(req);
}

export async function POST(req: NextRequest) {
    return createExamRoute(req);
}

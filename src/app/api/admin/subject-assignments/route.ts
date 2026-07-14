import {
    listSubjectAssignmentsRoute,
    createSubjectAssignmentRoute,
} from '@/modules/subject-assignments/subjectAssignment.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return listSubjectAssignmentsRoute(req);
}

export async function POST(req: NextRequest) {
    return createSubjectAssignmentRoute(req);
}

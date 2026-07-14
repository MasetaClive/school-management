import {
    getSubjectAssignmentRoute,
    updateSubjectAssignmentRoute,
    deleteSubjectAssignmentRoute,
} from '@/modules/subject-assignments/subjectAssignment.routes';
import { NextRequest } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return getSubjectAssignmentRoute(req, (await params).id);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return updateSubjectAssignmentRoute(req, (await params).id);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return deleteSubjectAssignmentRoute(req, (await params).id);
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { ReportCardService, ReportCardServiceError } from './reportCard.service';

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function ensureAdmin() {
    const user = await getCurrentUser();
    if (!user) throw new ApiError('Unauthorized', 401);

    const role = await getUserRole();
    if (role !== 'admin') throw new ApiError('Forbidden', 403);
}

function toJsonError(e: unknown) {
    if (e instanceof ApiError || e instanceof ReportCardServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    // eslint-disable-next-line no-console
    console.error('[report-cards] unexpected error', e);
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
    );
}

export const ReportCardController = {
    async getReport(req: NextRequest, studentId: string) {
        try {
            await ensureAdmin();

            const url = new URL(req.url);
            const examId = url.searchParams.get('exam_id');

            if (!examId) {
                return NextResponse.json({ error: 'exam_id is required' }, { status: 400 });
            }

            const report = await ReportCardService.generateReport(studentId, examId);
            return NextResponse.json(report, { status: 200 });
        } catch (e) {
            return toJsonError(e);
        }
    },
};

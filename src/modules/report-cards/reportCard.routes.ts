import { NextRequest } from 'next/server';
import { ReportCardController } from './reportCard.controller';

export const ReportCardRoutes = {
    async GET_REPORT(req: NextRequest, { params }: { params: { studentId: string } }) {
        return ReportCardController.getReport(req, params.studentId);
    },
};

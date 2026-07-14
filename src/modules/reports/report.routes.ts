import { NextRequest } from 'next/server';
import { ReportController } from './report.controller';

export const ReportRoutes = {
    async ACADEMIC(req: NextRequest) {
        return ReportController.getAcademicStats(req);
    },
    async FINANCIAL(req: NextRequest) {
        return ReportController.getFinancialStats(req);
    },
    async ATTENDANCE(req: NextRequest) {
        return ReportController.getAttendanceStats(req);
    }
};

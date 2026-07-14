import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from './report.service';

export const ReportController = {
    async getAcademicStats(req: NextRequest) {
        try {
            const data = await ReportService.getAcademicAnalytics();
            return NextResponse.json(data);
        } catch (e) {
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }
    },

    async getFinancialStats(req: NextRequest) {
        try {
            const data = await ReportService.getFinancialSummary();
            return NextResponse.json(data);
        } catch (e) {
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }
    },

    async getAttendanceStats(req: NextRequest) {
        try {
            const data = await ReportService.getAttendanceTrends();
            return NextResponse.json(data);
        } catch (e) {
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }
    }
};

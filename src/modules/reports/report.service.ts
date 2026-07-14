import { createClient } from '@/lib/supabase/server';

export class ReportService {
    /**
     * getAcademicAnalytics
     * Returns average marks per subject for all classes
     */
    static async getAcademicAnalytics() {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('exam_results')
            .select(`
                marks_obtained,
                subject:subjects(name),
                exam:exams(name)
            `);
        
        if (error) return [];

        // Simple aggregation logic
        const stats: Record<string, { total: number; count: number }> = {};
        data.forEach(r => {
            const subjectName = (r.subject as any)?.name || 'Unknown';
            const examName = (r.exam as any)?.name || 'General';
            const key = `${subjectName} (${examName})`;
            if (!stats[key]) stats[key] = { total: 0, count: 0 };
            stats[key].total += r.marks_obtained;
            stats[key].count += 1;
        });

        return Object.entries(stats).map(([name, s]) => ({
            name,
            average: Math.round((s.total / s.count) * 10) / 10
        }));
    }

    /**
     * getFinancialSummary
     */
    static async getFinancialSummary() {
        const supabase = await createClient();
        
        // 1. Total Fee Collections
        const { data: fees } = await supabase.from('fee_payments').select('amount_paid');
        const totalFees = fees?.reduce((acc, curr) => acc + Number(curr.amount_paid), 0) || 0;

        // 2. Total Payroll Expenses
        const { data: payroll } = await supabase.from('payroll_history').select('net_amount');
        const totalPayroll = payroll?.reduce((acc, curr) => acc + Number(curr.net_amount), 0) || 0;

        return {
            collections: totalFees,
            expenses: totalPayroll,
            net: totalFees - totalPayroll
        };
    }

    /**
     * getAttendanceTrends
     */
    static async getAttendanceTrends() {
        const supabase = await createClient();
        // Simplified: just return count of present/absent logs
        const { data } = await supabase.from('attendance_logs').select('status');
        
        const present = data?.filter(a => a.status === 'present').length || 0;
        const total = data?.length || 1;

        return {
            attendanceRate: Math.round((present / total) * 100)
        };
    }
}

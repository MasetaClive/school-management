import { createClient } from '@/lib/supabase/server';

export class PayrollServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class PayrollService {
    static async setSalaryConfig(teacherId: string, baseSalary: number, allowances = 0, deductions = 0) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('staff_salaries')
            .upsert({
                teacher_id: teacherId,
                base_salary: baseSalary,
                allowances,
                deductions
            })
            .select('*')
            .single();

        if (error) throw new PayrollServiceError('Failed to configure salary', 500);
        return data;
    }

    static async listSalaries() {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('staff_salaries')
            .select(`
                *,
                teacher:teachers(full_name, teacher_id)
            `);
        if (error) throw new PayrollServiceError('Failed to fetch salary configurations', 500);
        return data;
    }

    static async generateMonthlyPayroll(month: number, year: number) {
        const supabase = await createClient();

        // 1. Get all staff salary configs
        const { data: configs, error: configError } = await supabase
            .from('staff_salaries')
            .select('*');

        if (configError) throw new PayrollServiceError('Failed to fetch salary configurations', 500);

        // 2. Generate records for each staff member
        const records = configs.map(config => ({
            teacher_id: config.teacher_id,
            month,
            year,
            base_amount: config.base_salary,
            total_allowances: config.allowances,
            total_deductions: config.deductions,
            net_amount: Number(config.base_salary) + Number(config.allowances) - Number(config.deductions),
            status: 'draft'
        }));

        const { data, error } = await supabase
            .from('payroll_records')
            .insert(records)
            .select('*');

        if (error) {
            if (error.code === '23505') throw new PayrollServiceError(`Payroll already generated for ${month}/${year}`, 409);
            throw new PayrollServiceError('Failed to generate payroll', 500);
        }

        return data;
    }

    static async listPayrollHistory(year: number, month?: number) {
        const supabase = await createClient();
        let req = supabase
            .from('payroll_records')
            .select(`
                *,
                teacher:teachers(full_name, teacher_id)
            `)
            .eq('year', year);
        
        if (month) req = req.eq('month', month);

        const { data, error } = await req.order('month', { ascending: false });
        if (error) throw new PayrollServiceError('Failed to fetch payroll history', 500);
        return data;
    }
}

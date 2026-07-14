import { createClient } from '@/lib/supabase/server';
import type {
    CreateStudentAttendanceInput,
    UpdateStudentAttendanceInput,
    ListStudentAttendanceQuery,
} from './studentAttendance.validation';

export class StudentAttendanceServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class StudentAttendanceService {
    static async createAttendance(input: CreateStudentAttendanceInput) {
        const supabase = await createClient();

        // Check for unique constraint: (student_id, attendance_date)
        const { data: existing, error: checkError } = await supabase
            .from('student_attendance')
            .select('id')
            .eq('student_id', input.student_id)
            .eq('attendance_date', input.attendance_date)
            .maybeSingle();

        if (checkError) throw new StudentAttendanceServiceError('Failed to validate attendance', 500);
        if (existing) {
            throw new StudentAttendanceServiceError('Attendance already recorded for this student on this date', 409);
        }

        const { data, error } = await supabase
            .from('student_attendance')
            .insert({
                student_id: input.student_id,
                class_id: input.class_id,
                attendance_date: input.attendance_date,
                status: input.status,
                remarks: input.remarks || null,
                recorded_by: input.recorded_by || null,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new StudentAttendanceServiceError('Attendance already recorded for this student on this date', 409);
            }
            throw new StudentAttendanceServiceError('Failed to record attendance', 500);
        }

        return data;
    }

    static async getAttendanceById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('student_attendance')
            .select(`
        *,
        student:students(id, full_name, student_id),
        class:classes(id, name, grade_level),
        recorder:teachers(id, full_name, teacher_id)
      `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw new StudentAttendanceServiceError('Failed to fetch attendance record', 500);
        if (!data) throw new StudentAttendanceServiceError('Attendance record not found', 404);
        return data;
    }

    static async updateAttendance(id: string, input: UpdateStudentAttendanceInput) {
        const supabase = await createClient();

        // Fetch existing logic to handle unique check if date changed
        const existingEntry = await this.getAttendanceById(id);
        const attendance_date = input.attendance_date ?? existingEntry.attendance_date;
        const student_id = existingEntry.student_id;

        if (input.attendance_date) {
            const { data: conflict, error: checkError } = await supabase
                .from('student_attendance')
                .select('id')
                .eq('student_id', student_id)
                .eq('attendance_date', attendance_date)
                .neq('id', id)
                .maybeSingle();

            if (checkError) throw new StudentAttendanceServiceError('Failed to validate attendance', 500);
            if (conflict) {
                throw new StudentAttendanceServiceError('Attendance already recorded for this student on this date', 409);
            }
        }

        const { data, error } = await supabase
            .from('student_attendance')
            .update({
                attendance_date,
                status: input.status ?? existingEntry.status,
                remarks: input.remarks !== undefined ? input.remarks : existingEntry.remarks,
                recorded_by: input.recorded_by !== undefined ? input.recorded_by : existingEntry.recorded_by,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new StudentAttendanceServiceError('Failed to update attendance', 500);
        }

        return data;
    }

    static async deleteAttendance(id: string) {
        const supabase = await createClient();
        const { error } = await supabase.from('student_attendance').delete().eq('id', id);

        if (error) {
            throw new StudentAttendanceServiceError('Failed to delete attendance record', 500);
        }

        return { success: true };
    }

    static async listAttendance(query: ListStudentAttendanceQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        let req = supabase
            .from('student_attendance')
            .select(`
        id,
        attendance_date,
        status,
        remarks,
        student:students(full_name, student_id),
        class:classes(name)
      `, { count: 'exact' })
            .order('attendance_date', { ascending: false });

        if (query.student_id) req = req.eq('student_id', query.student_id);
        if (query.class_id) req = req.eq('class_id', query.class_id);
        if (query.date) req = req.eq('attendance_date', query.date);

        const { data, error, count } = await req.range(from, to);

        if (error) {
            throw new StudentAttendanceServiceError('Failed to fetch attendance history', 500);
        }

        return {
            data: data ?? [],
            page,
            pageSize: PAGE_SIZE,
            total: count ?? 0,
            totalPages: count ? Math.ceil(count / PAGE_SIZE) : 1,
        };
    }
}

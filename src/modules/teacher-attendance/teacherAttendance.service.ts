import { createClient } from '@/lib/supabase/server';
import type {
    CreateTeacherAttendanceInput,
    UpdateTeacherAttendanceInput,
    ListTeacherAttendanceQuery,
} from './teacherAttendance.validation';

export class TeacherAttendanceServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class TeacherAttendanceService {
    static async createAttendance(input: CreateTeacherAttendanceInput) {
        const supabase = await createClient();

        // Check unique constraint: (teacher_id, attendance_date)
        const { data: existing, error: checkError } = await supabase
            .from('teacher_attendance')
            .select('id')
            .eq('teacher_id', input.teacher_id)
            .eq('attendance_date', input.attendance_date)
            .maybeSingle();

        if (checkError) throw new TeacherAttendanceServiceError('Failed to validate attendance', 500);
        if (existing) {
            throw new TeacherAttendanceServiceError('Attendance already recorded for this teacher on this date', 409);
        }

        const { data, error } = await supabase
            .from('teacher_attendance')
            .insert({
                teacher_id: input.teacher_id,
                attendance_date: input.attendance_date,
                status: input.status,
                remarks: input.remarks || null,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new TeacherAttendanceServiceError('Attendance already recorded for this teacher on this date', 409);
            }
            throw new TeacherAttendanceServiceError('Failed to record attendance', 500);
        }

        return data;
    }

    static async getAttendanceById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('teacher_attendance')
            .select(`
        *,
        teacher:teachers(id, full_name, teacher_id)
      `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw new TeacherAttendanceServiceError('Failed to fetch attendance record', 500);
        if (!data) throw new TeacherAttendanceServiceError('Attendance record not found', 404);
        return data;
    }

    static async updateAttendance(id: string, input: UpdateTeacherAttendanceInput) {
        const supabase = await createClient();

        // Existence check
        const existingEntry = await this.getAttendanceById(id);
        const attendance_date = input.attendance_date ?? existingEntry.attendance_date;
        const teacher_id = existingEntry.teacher_id;

        if (input.attendance_date) {
            const { data: conflict, error: checkError } = await supabase
                .from('teacher_attendance')
                .select('id')
                .eq('teacher_id', teacher_id)
                .eq('attendance_date', attendance_date)
                .neq('id', id)
                .maybeSingle();

            if (checkError) throw new TeacherAttendanceServiceError('Failed to validate attendance', 500);
            if (conflict) {
                throw new TeacherAttendanceServiceError('Attendance already recorded for this teacher on this date', 409);
            }
        }

        const { data, error } = await supabase
            .from('teacher_attendance')
            .update({
                attendance_date,
                status: input.status ?? existingEntry.status,
                remarks: input.remarks !== undefined ? input.remarks : existingEntry.remarks,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new TeacherAttendanceServiceError('Failed to update attendance', 500);
        }

        return data;
    }

    static async deleteAttendance(id: string) {
        const supabase = await createClient();
        const { error } = await supabase.from('teacher_attendance').delete().eq('id', id);

        if (error) {
            throw new TeacherAttendanceServiceError('Failed to delete attendance record', 500);
        }

        return { success: true };
    }

    static async listAttendance(query: ListTeacherAttendanceQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        let req = supabase
            .from('teacher_attendance')
            .select(`
        id,
        attendance_date,
        status,
        remarks,
        teacher:teachers(full_name, teacher_id)
      `, { count: 'exact' })
            .order('attendance_date', { ascending: false });

        if (query.teacher_id) req = req.eq('teacher_id', query.teacher_id);
        if (query.date) req = req.eq('attendance_date', query.date);

        const { data, error, count } = await req.range(from, to);

        if (error) {
            throw new TeacherAttendanceServiceError('Failed to fetch attendance history', 500);
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

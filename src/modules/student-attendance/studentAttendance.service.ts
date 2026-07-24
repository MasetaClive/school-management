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
    private static async ensureReferencesAreValid(studentId: string, classId: string, recordedBy: string | null | undefined) {
        const supabase = await createClient();
        const [student, classRecord, recorder] = await Promise.all([
            supabase.from('students').select('id, class_id').eq('id', studentId).maybeSingle(),
            supabase.from('classes').select('id').eq('id', classId).maybeSingle(),
            recordedBy ? supabase.from('teachers').select('id').eq('id', recordedBy).maybeSingle() : Promise.resolve({ data: null, error: null }),
        ]);

        if (student.error || classRecord.error || recorder.error) {
            throw new StudentAttendanceServiceError('Failed to validate attendance references', 500);
        }
        if (!student.data) throw new StudentAttendanceServiceError('Student not found', 404);
        if (!classRecord.data) throw new StudentAttendanceServiceError('Class not found', 404);
        if (recordedBy && !recorder.data) throw new StudentAttendanceServiceError('Recording teacher not found', 404);
        if (student.data.class_id !== classId) {
            throw new StudentAttendanceServiceError('Student is not assigned to the selected class', 409);
        }
    }

    private static async ensureNoDuplicate(studentId: string, attendanceDate: string, excludeId?: string) {
        const supabase = await createClient();
        let request = supabase.from('student_attendance').select('id')
            .eq('student_id', studentId).eq('attendance_date', attendanceDate);
        if (excludeId) request = request.neq('id', excludeId);
        const { data, error } = await request.maybeSingle();
        if (error) throw new StudentAttendanceServiceError('Failed to validate attendance', 500);
        if (data) throw new StudentAttendanceServiceError('Attendance already recorded for this student on this date', 409);
    }

    static async createAttendance(input: CreateStudentAttendanceInput) {
        await this.ensureReferencesAreValid(input.student_id, input.class_id, input.recorded_by);
        await this.ensureNoDuplicate(input.student_id, input.attendance_date);
        const supabase = await createClient();

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
        const existingEntry = await this.getAttendanceById(id);
        const attendance_date = input.attendance_date ?? existingEntry.attendance_date;
        const student_id = input.student_id ?? existingEntry.student_id;
        const class_id = input.class_id ?? existingEntry.class_id;
        const recorded_by = input.recorded_by !== undefined ? input.recorded_by : existingEntry.recorded_by;
        await this.ensureReferencesAreValid(student_id, class_id, recorded_by);
        await this.ensureNoDuplicate(student_id, attendance_date, id);
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('student_attendance')
            .update({
                student_id,
                class_id,
                attendance_date,
                status: input.status ?? existingEntry.status,
                remarks: input.remarks !== undefined ? input.remarks : existingEntry.remarks,
                recorded_by,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505' || error.code === 'P0001') {
                throw new StudentAttendanceServiceError(error.message || 'Attendance already recorded for this student on this date', 409);
            }
            throw new StudentAttendanceServiceError('Failed to update attendance', 500);
        }

        return data;
    }

    static async deleteAttendance(id: string) {
        await this.getAttendanceById(id);
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
            .order('attendance_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (query.student_id) req = req.eq('student_id', query.student_id);
        if (query.class_id) req = req.eq('class_id', query.class_id);
        if (query.date) req = req.eq('attendance_date', query.date);
        if (query.status) req = req.eq('status', query.status);

        if (query.search) {
            const term = query.search.replace(/[,%_()]/g, '');
            if (!term) return { data: [], page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
            const pattern = `%${term}%`;
            const [students, classes] = await Promise.all([
                supabase.from('students').select('id').or(`full_name.ilike.${pattern},student_id.ilike.${pattern}`),
                supabase.from('classes').select('id').or(`name.ilike.${pattern},grade_level.ilike.${pattern}`),
            ]);
            if (students.error || classes.error) throw new StudentAttendanceServiceError('Failed to search attendance history', 500);
            const filters = [
                ...(students.data ?? []).map(({ id }) => `student_id.eq.${id}`),
                ...(classes.data ?? []).map(({ id }) => `class_id.eq.${id}`),
            ];
            if (!filters.length) return { data: [], page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
            req = req.or(filters.join(','));
        }

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

import { createClient } from '@/lib/supabase/server';
import { UserService } from '@/modules/users/user.service';
import type { CreateTeacherInput, UpdateTeacherInput } from './teacher.validation';

export class TeacherServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class TeacherService {
    static async getTeacherByUserId(userId: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) return null;
        return data;
    }

    static async listTeachers(query: { page?: number; search?: string }) {
        const supabase = await createClient();
        const limit = 10;
        const offset = ((query.page || 1) - 1) * limit;

        let req = supabase
            .from('teachers')
            .select('*', { count: 'exact' });

        if (query.search) {
            req = req.or(`full_name.ilike.%${query.search}%,teacher_id.ilike.%${query.search}%`);
        }

        const { data, count, error } = await req
            .order('full_name')
            .range(offset, offset + limit - 1);

        if (error) throw new TeacherServiceError('Failed to fetch teachers', 500);

        return {
            data: data || [],
            total: count || 0,
            page: query.page || 1,
            totalPages: Math.ceil((count || 0) / limit)
        };
    }

    static async getTeacherById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('teachers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw new TeacherServiceError('Teacher not found', 404);
        return data;
    }

    static async createTeacher(input: CreateTeacherInput) {
        const { create_account, password_mode: _passwordMode, password, teacher_id, full_name, email: inputEmail, ...rest } = input;
        
        const supabase = await createClient();
        let account = null;

        if (create_account) {
            account = await UserService.provisionAccount({
                role: 'teacher',
                username: teacher_id,
                fullName: full_name,
                password,
            });
        }

        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .insert({
                teacher_id,
                full_name,
                email: inputEmail,
                user_id: account?.userId ?? null,
                ...rest
            })
            .select('*')
            .single();

        if (teacherError) {
            if (account) await UserService.rollbackProvisionedAccount(account.userId);
            if (teacherError.code === '23505') throw new TeacherServiceError('Teacher ID already exists', 409);
            throw new TeacherServiceError(`Failed to create teacher: ${teacherError.message}`, 500);
        }

        return { profile: teacher, account };
    }

    static async updateTeacher(id: string, input: UpdateTeacherInput) {
        await this.getTeacherById(id);
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('teachers')
            .update(input)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw new TeacherServiceError('Failed to update teacher', 500);
        return data;
    }

    static async deleteTeacher(id: string) {
        const teacher = await this.getTeacherById(id);
        const supabase = await createClient();

        const [classTeacherCheck, subjectAssignmentCheck] = await Promise.all([
            supabase
                .from('class_teachers')
                .select('id', { count: 'exact', head: true })
                .eq('teacher_id', id),
            supabase
                .from('subject_assignments')
                .select('id', { count: 'exact', head: true })
                .eq('teacher_id', id),
        ]);

        if (classTeacherCheck.error || subjectAssignmentCheck.error) {
            throw new TeacherServiceError('Failed to check teacher assignments', 500);
        }
        if ((classTeacherCheck.count ?? 0) > 0 || (subjectAssignmentCheck.count ?? 0) > 0) {
            throw new TeacherServiceError(
                'Cannot delete teacher with active class or subject assignments.',
                409,
            );
        }

        const { error } = await supabase
            .from('teachers')
            .delete()
            .eq('id', id);

        if (error) throw new TeacherServiceError('Failed to delete teacher', 500);

        if (teacher.user_id) {
            await UserService.rollbackProvisionedAccount(teacher.user_id);
        }
        return { success: true };
    }

    static async getDashboardStats(teacherId: string) {
        const supabase = await createClient();
        
        // 1. Count assigned classes
        const { count: classCount } = await supabase
            .from('subject_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacherId);

        // 2. Count pending homework
        const { count: homeworkCount } = await supabase
            .from('homework')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacherId)
            .gte('due_date', new Date().toISOString());

        // 3. Get Today's schedule
        const dayOfWeek = new Date().getDay(); // 0-6
        const { data: schedule } = await supabase
            .from('timetable_entries')
            .select(`
                id,
                class:classes(name),
                subject:subjects(name, code),
                time_slot:time_slots!inner(start_time, end_time, day_of_week)
            `)
            .eq('teacher_id', teacherId)
            .eq('time_slot.day_of_week', dayOfWeek);

        return {
            classCount: classCount || 0,
            homeworkCount: homeworkCount || 0,
            schedule: schedule || []
        };
    }
}

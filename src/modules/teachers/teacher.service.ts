import { createClient, createAdminClient } from '@/lib/supabase/server';

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

    static async createTeacher(input: any) {
        const { create_account, password, teacher_id, full_name, email: inputEmail, ...rest } = input;
        
        const supabase = await createClient();
        const adminSupabase = await createAdminClient();

        // 1. Create Teacher Profile
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .insert({
                teacher_id,
                full_name,
                email: inputEmail,
                ...rest
            })
            .select('*')
            .single();

        if (teacherError) {
            if (teacherError.code === '23505') throw new TeacherServiceError('Teacher ID already exists', 409);
            throw new TeacherServiceError(`Failed to create teacher: ${teacherError.message}`, 500);
        }

        // 2. Automated Account Creation
        if (create_account && password) {
            const email = inputEmail || `${teacher_id.toLowerCase()}@school.local`;

            // A. Create Auth User
            const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name, role: 'teacher' }
            });

            if (authError) {
                throw new TeacherServiceError(`Teacher created, but failed to create login account: ${authError.message}`, 500);
            }

            const userId = authUser.user.id;

            // B. Create Public User Record
            const { error: userError } = await adminSupabase
                .from('users')
                .insert({
                    id: userId,
                    email,
                    full_name,
                    role: 'teacher',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

            if (userError) {
                throw new TeacherServiceError(`Teacher and Auth created, but failed to sync public user: ${userError.message}`, 500);
            }

            // C. Link User ID back to Teacher Profile
            await adminSupabase
                .from('teachers')
                .update({ user_id: userId })
                .eq('id', teacher.id);
        }

        return teacher;
    }

    static async updateTeacher(id: string, input: any) {
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
        const supabase = await createClient();
        const { error } = await supabase
            .from('teachers')
            .delete()
            .eq('id', id);

        if (error) throw new TeacherServiceError('Failed to delete teacher', 500);
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
                time_slot:time_slots(start_time, end_time)
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

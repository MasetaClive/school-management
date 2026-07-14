import { createClient } from '@/lib/supabase/server';
import type {
    CreateClassTeacherInput,
    UpdateClassTeacherInput,
    ListClassTeachersQuery,
} from './classTeacher.validation';

export class ClassTeacherServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class ClassTeacherService {
    static async getClassTeachers(query: ListClassTeachersQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        let req = supabase
            .from('class_teachers')
            .select(`
        *,
        class:classes(id, name, grade_level),
        teacher:teachers(id, full_name, teacher_id)
      `, { count: 'exact' });

        if (query.class_id) req = req.eq('class_id', query.class_id);
        if (query.teacher_id) req = req.eq('teacher_id', query.teacher_id);

        const { data, error, count } = await req
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            throw new ClassTeacherServiceError('Failed to fetch class teachers', 500);
        }

        return {
            data: data ?? [],
            page,
            pageSize: PAGE_SIZE,
            total: count ?? 0,
            totalPages: count ? Math.ceil(count / PAGE_SIZE) : 1,
        };
    }

    static async getClassTeacherById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('class_teachers')
            .select(`
        *,
        class:classes(id, name, grade_level),
        teacher:teachers(id, full_name, teacher_id)
      `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw new ClassTeacherServiceError('Failed to fetch class teacher assignment', 500);
        if (!data) throw new ClassTeacherServiceError('Class teacher assignment not found', 404);
        return data;
    }

    static async createClassTeacher(input: CreateClassTeacherInput) {
        const supabase = await createClient();

        // 1. If is_homeroom = true, ensure no other homeroom teacher exists for same class/year
        if (input.is_homeroom) {
            const { data: existingHomeroom, error: homeroomError } = await supabase
                .from('class_teachers')
                .select('id')
                .eq('class_id', input.class_id)
                .eq('academic_year', input.academic_year)
                .eq('is_homeroom', true)
                .maybeSingle();

            if (homeroomError) throw new ClassTeacherServiceError('Failed to verify homeroom status', 500);
            if (existingHomeroom) throw new ClassTeacherServiceError('This class already has a homeroom teacher for the selected academic year', 409);
        }

        // 2. Insert record
        const { data, error } = await supabase
            .from('class_teachers')
            .insert({
                class_id: input.class_id,
                teacher_id: input.teacher_id,
                is_homeroom: input.is_homeroom,
                academic_year: input.academic_year,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new ClassTeacherServiceError('Teacher already assigned to this class for the selected academic year', 409);
            }
            throw new ClassTeacherServiceError('Failed to assign teacher to class', 500);
        }

        return data;
    }

    static async updateClassTeacher(id: string, input: UpdateClassTeacherInput) {
        const supabase = await createClient();

        // Fetch existing
        const existing = await this.getClassTeacherById(id);

        // If changing to homeroom, check if another exists
        if (input.is_homeroom && !existing.is_homeroom) {
            const academicYear = input.academic_year || existing.academic_year;
            const { data: anotherHomeroom, error: homeroomError } = await supabase
                .from('class_teachers')
                .select('id')
                .eq('class_id', existing.class_id)
                .eq('academic_year', academicYear)
                .eq('is_homeroom', true)
                .neq('id', id)
                .maybeSingle();

            if (homeroomError) throw new ClassTeacherServiceError('Failed to verify homeroom status', 500);
            if (anotherHomeroom) throw new ClassTeacherServiceError('This class already has a homeroom teacher for the selected academic year', 409);
        }

        const { data, error } = await supabase
            .from('class_teachers')
            .update({
                is_homeroom: input.is_homeroom,
                academic_year: input.academic_year,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new ClassTeacherServiceError('Failed to update class teacher assignment', 500);
        }

        return data;
    }

    static async deleteClassTeacher(id: string) {
        const supabase = await createClient();

        // Check existence
        await this.getClassTeacherById(id);

        const { error } = await supabase
            .from('class_teachers')
            .delete()
            .eq('id', id);

        if (error) {
            throw new ClassTeacherServiceError('Failed to delete class teacher assignment', 500);
        }

        return { success: true };
    }
}

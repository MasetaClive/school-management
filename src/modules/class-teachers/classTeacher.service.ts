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
    private static async ensureReferencesExist(classId: string, teacherId: string, academicYear: string) {
        const supabase = await createClient();
        const [classRecord, teacher, year] = await Promise.all([
            supabase.from('classes').select('id').eq('id', classId).maybeSingle(),
            supabase.from('teachers').select('id').eq('id', teacherId).maybeSingle(),
            supabase.from('academic_years').select('id, is_closed').eq('year', academicYear).maybeSingle(),
        ]);

        if (classRecord.error || teacher.error || year.error) {
            throw new ClassTeacherServiceError('Failed to validate class teacher references', 500);
        }
        if (!classRecord.data) throw new ClassTeacherServiceError('Class not found', 404);
        if (!teacher.data) throw new ClassTeacherServiceError('Teacher not found', 404);
        if (!year.data) throw new ClassTeacherServiceError('Academic year not found', 404);
        if (year.data.is_closed) throw new ClassTeacherServiceError('Cannot assign a class teacher to a closed academic year', 409);
    }

    private static async ensureAssignmentIsAvailable(
        classId: string,
        teacherId: string,
        academicYear: string,
        isHomeroom: boolean,
        excludeId?: string,
    ) {
        const supabase = await createClient();
        let duplicate = supabase
            .from('class_teachers')
            .select('id')
            .eq('class_id', classId)
            .eq('teacher_id', teacherId)
            .eq('academic_year', academicYear);
        let classHomeroom = supabase
            .from('class_teachers')
            .select('id')
            .eq('class_id', classId)
            .eq('academic_year', academicYear)
            .eq('is_homeroom', true);
        let teacherHomeroom = supabase
            .from('class_teachers')
            .select('id')
            .eq('teacher_id', teacherId)
            .eq('academic_year', academicYear)
            .eq('is_homeroom', true);

        if (excludeId) {
            duplicate = duplicate.neq('id', excludeId);
            classHomeroom = classHomeroom.neq('id', excludeId);
            teacherHomeroom = teacherHomeroom.neq('id', excludeId);
        }

        const [duplicateResult, classHomeroomResult, teacherHomeroomResult] = await Promise.all([
            duplicate.maybeSingle(),
            isHomeroom ? classHomeroom.maybeSingle() : Promise.resolve({ data: null, error: null }),
            isHomeroom ? teacherHomeroom.maybeSingle() : Promise.resolve({ data: null, error: null }),
        ]);

        if (duplicateResult.error || classHomeroomResult.error || teacherHomeroomResult.error) {
            throw new ClassTeacherServiceError('Failed to validate class teacher assignment', 500);
        }
        if (duplicateResult.data) {
            throw new ClassTeacherServiceError('Teacher is already assigned to this class for the selected academic year', 409);
        }
        if (classHomeroomResult.data) {
            throw new ClassTeacherServiceError('This class already has an active class teacher for the selected academic year', 409);
        }
        if (teacherHomeroomResult.data) {
            throw new ClassTeacherServiceError('This teacher is already the active class teacher for another class in the selected academic year', 409);
        }
    }

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
      `, { count: 'exact' })
            .order('academic_year', { ascending: false })
            .order('created_at', { ascending: false });

        if (query.class_id) req = req.eq('class_id', query.class_id);
        if (query.teacher_id) req = req.eq('teacher_id', query.teacher_id);
        if (query.academic_year) req = req.eq('academic_year', query.academic_year);

        if (query.search) {
            const term = query.search.replace(/[,%_()]/g, '');
            if (!term) return { data: [], page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
            const pattern = `%${term}%`;
            const [teachers, classes] = await Promise.all([
                supabase.from('teachers').select('id').or(`full_name.ilike.${pattern},teacher_id.ilike.${pattern}`),
                supabase.from('classes').select('id').or(`name.ilike.${pattern},grade_level.ilike.${pattern}`),
            ]);
            if (teachers.error || classes.error) throw new ClassTeacherServiceError('Failed to search class teachers', 500);
            req = req.or([
                `academic_year.ilike.${pattern}`,
                ...(teachers.data ?? []).map(({ id }) => `teacher_id.eq.${id}`),
                ...(classes.data ?? []).map(({ id }) => `class_id.eq.${id}`),
            ].join(','));
        }

        const { data, error, count } = await req
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
        await this.ensureReferencesExist(input.class_id, input.teacher_id, input.academic_year);
        await this.ensureAssignmentIsAvailable(input.class_id, input.teacher_id, input.academic_year, input.is_homeroom);
        const supabase = await createClient();

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
            if (error.code === '23505') throw new ClassTeacherServiceError('This class teacher assignment conflicts with an existing active assignment', 409);
            throw new ClassTeacherServiceError('Failed to assign teacher to class', 500);
        }

        return data;
    }

    static async updateClassTeacher(id: string, input: UpdateClassTeacherInput) {
        const existing = await this.getClassTeacherById(id);
        const classId = input.class_id ?? existing.class_id;
        const teacherId = input.teacher_id ?? existing.teacher_id;
        const academicYear = input.academic_year ?? existing.academic_year;
        const isHomeroom = input.is_homeroom ?? existing.is_homeroom;
        await this.ensureReferencesExist(classId, teacherId, academicYear);
        await this.ensureAssignmentIsAvailable(classId, teacherId, academicYear, isHomeroom, id);
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('class_teachers')
            .update({
                class_id: classId,
                teacher_id: teacherId,
                is_homeroom: isHomeroom,
                academic_year: academicYear,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') throw new ClassTeacherServiceError('This class teacher assignment conflicts with an existing active assignment', 409);
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

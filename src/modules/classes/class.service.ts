import { createClient } from '@/lib/supabase/server';
import type {
    CreateClassInput,
    UpdateClassInput,
    ListClassesQuery,
} from './class.validation';

export class ClassServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class ClassService {
    static async ensureClassUnique(name: string, academic_year: string, excludeId?: string) {
        const supabase = await createClient();
        let query = supabase
            .from('classes')
            .select('id')
            .eq('name', name)
            .eq('academic_year', academic_year);

        if (excludeId) query = query.neq('id', excludeId);
        const { data, error } = await query.maybeSingle();
        if (error) throw new ClassServiceError('Failed to validate class uniqueness', 500);
        if (data) throw new ClassServiceError('Class with this name already exists for the academic year', 400);
    }

    static async ensureAcademicYearExists(academicYear: string) {
        const supabase = await createClient();
        const { data, error } = await supabase.from('academic_years').select('id, is_closed').eq('year', academicYear).maybeSingle();
        if (error) throw new ClassServiceError('Failed to validate academic year', 500);
        if (!data) throw new ClassServiceError('Academic year not found', 400);
        if (data.is_closed) throw new ClassServiceError('Cannot assign a class to a closed academic year', 409);
    }

    static async createClass(input: CreateClassInput) {
        const { name, grade_level, academic_year } = input;

        await this.ensureClassUnique(name, academic_year);
        await this.ensureAcademicYearExists(academic_year);

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('classes')
            .insert({
                name,
                grade_level,
                academic_year,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new ClassServiceError('Class with this name already exists for the academic year', 400);
            }
            throw new ClassServiceError('Failed to create class', 500);
        }

        return data;
    }

    static async getClassById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw new ClassServiceError('Failed to fetch class', 500);
        if (!data) throw new ClassServiceError('Class not found', 404);
        return data;
    }

    static async updateClass(id: string, input: UpdateClassInput) {
        const existing = await this.getClassById(id);
        const name = input.name ?? existing.name;
        const academicYear = input.academic_year ?? existing.academic_year;
        await this.ensureClassUnique(name, academicYear, id);
        await this.ensureAcademicYearExists(academicYear);

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('classes')
            .update({
                name,
                grade_level: input.grade_level ?? existing.grade_level,
                academic_year: academicYear,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new ClassServiceError('Class with this name already exists for the academic year', 409);
            }
            throw new ClassServiceError('Failed to update class', 500);
        }

        return data;
    }

    static async deleteClass(id: string) {
        await this.getClassById(id);

        const supabase = await createClient();

        const checks = await Promise.all([
            supabase.from('students').select('id', { count: 'exact', head: true }).eq('class_id', id),
            supabase.from('class_teachers').select('id', { count: 'exact', head: true }).eq('class_id', id),
            supabase.from('subject_assignments').select('id', { count: 'exact', head: true }).eq('class_id', id),
            supabase.from('timetable_entries').select('id', { count: 'exact', head: true }).eq('class_id', id),
            supabase.from('student_attendance').select('id', { count: 'exact', head: true }).eq('class_id', id),
            supabase.from('homework').select('id', { count: 'exact', head: true }).eq('class_id', id),
            supabase.from('exams').select('id', { count: 'exact', head: true }).eq('class_id', id),
        ]);
        if (checks.some((check) => check.error)) throw new ClassServiceError('Failed to check class dependencies', 500);
        if (checks.some((check) => (check.count ?? 0) > 0)) {
            throw new ClassServiceError('Cannot delete class with dependent records.', 409);
        }

        const { error } = await supabase.from('classes').delete().eq('id', id);

        if (error) {
            if (error.code === 'P0001') {
                throw new ClassServiceError('Cannot delete class with dependent records.', 409);
            }
            throw new ClassServiceError('Failed to delete class', 500);
        }

        return { success: true };
    }

    static async listClasses(query: ListClassesQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        let req = supabase
            .from('classes')
            .select('*', { count: 'exact' })
            .order('grade_level', { ascending: true })
            .order('name', { ascending: true });

        if (query.search) {
            req = req.ilike('name', `%${query.search}%`);
        }

        const { data, error, count } = await req.range(from, to);

        if (error) {
            throw new ClassServiceError('Failed to fetch classes', 500);
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

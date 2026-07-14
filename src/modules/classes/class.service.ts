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
    static async ensureClassUnique(name: string, academic_year: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('classes')
            .select('id')
            .eq('name', name)
            .eq('academic_year', academic_year)
            .maybeSingle();

        if (error) throw new ClassServiceError('Failed to validate class uniqueness', 500);
        if (data) throw new ClassServiceError('Class with this name already exists for the academic year', 400);
    }

    static async createClass(input: CreateClassInput) {
        const { name, grade_level, academic_year } = input;

        await this.ensureClassUnique(name, academic_year);

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

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('classes')
            .update({
                name: input.name ?? existing.name,
                grade_level: input.grade_level ?? existing.grade_level,
                academic_year: input.academic_year ?? existing.academic_year,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new ClassServiceError('Failed to update class', 500);
        }

        return data;
    }

    static async deleteClass(id: string) {
        await this.getClassById(id);

        const supabase = await createClient();

        const { count, error: countError } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('class_id', id);

        if (countError) {
            throw new ClassServiceError('Failed to check linked students', 500);
        }

        if ((count ?? 0) > 0) {
            throw new ClassServiceError('Cannot delete class with enrolled students', 409);
        }

        const { error } = await supabase.from('classes').delete().eq('id', id);

        if (error) {
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

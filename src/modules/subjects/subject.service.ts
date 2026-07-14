import { createClient } from '@/lib/supabase/server';
import type {
    CreateSubjectInput,
    UpdateSubjectInput,
    ListSubjectsQuery,
} from './subject.validation';

export class SubjectServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class SubjectService {
    static async ensureCodeUnique(code: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('subjects')
            .select('id')
            .eq('code', code)
            .maybeSingle();

        if (error) throw new SubjectServiceError('Failed to validate code uniqueness', 500);
        if (data) throw new SubjectServiceError('Subject code already exists', 400);
    }

    static async createSubject(input: CreateSubjectInput) {
        const { name, code, description } = input;

        await this.ensureCodeUnique(code);

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('subjects')
            .insert({
                name,
                code,
                description: description || null,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new SubjectServiceError('Subject code already exists', 400);
            }
            throw new SubjectServiceError('Failed to create subject', 500);
        }

        return data;
    }

    static async getSubjectById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw new SubjectServiceError('Failed to fetch subject', 500);
        if (!data) throw new SubjectServiceError('Subject not found', 404);
        return data;
    }

    static async updateSubject(id: string, input: UpdateSubjectInput) {
        await this.getSubjectById(id);

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('subjects')
            .update({
                name: input.name,
                description: input.description,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new SubjectServiceError('Failed to update subject', 500);
        }

        return data;
    }

    static async deleteSubject(id: string) {
        await this.getSubjectById(id);

        const supabase = await createClient();

        // Preparation for conflict detection in future modules
        // e.g. check if subject is used in assignments, timetable, etc.
        const { error } = await supabase.from('subjects').delete().eq('id', id);

        if (error) {
            if (error.code === '23503') {
                throw new SubjectServiceError('Cannot delete subject that is being used', 409);
            }
            throw new SubjectServiceError('Failed to delete subject', 500);
        }

        return { success: true };
    }

    static async listSubjects(query: ListSubjectsQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        let req = supabase
            .from('subjects')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (query.search) {
            req = req.or(`name.ilike.%${query.search}%,code.ilike.%${query.search}%`);
        }

        const { data, error, count } = await req.range(from, to);

        if (error) {
            throw new SubjectServiceError('Failed to fetch subjects', 500);
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

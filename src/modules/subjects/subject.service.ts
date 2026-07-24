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
    static async ensureSubjectUnique(name: string, code: string, excludeId?: string) {
        const supabase = await createClient();
        let codeQuery = supabase.from('subjects').select('id').eq('code', code);
        let nameQuery = supabase.from('subjects').select('id').ilike('name', name);
        if (excludeId) { codeQuery = codeQuery.neq('id', excludeId); nameQuery = nameQuery.neq('id', excludeId); }
        const [codeResult, nameResult] = await Promise.all([codeQuery.maybeSingle(), nameQuery.maybeSingle()]);
        if (codeResult.error || nameResult.error) throw new SubjectServiceError('Failed to validate subject uniqueness', 500);
        if (codeResult.data) throw new SubjectServiceError('Subject code already exists', 409);
        if (nameResult.data) throw new SubjectServiceError('Subject name already exists', 409);
    }

    static async createSubject(input: CreateSubjectInput) {
        const name = input.name.trim();
        const code = input.code.trim().toUpperCase();
        const { description } = input;

        await this.ensureSubjectUnique(name, code);

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
            if (error.code === '23505') throw new SubjectServiceError('Subject name or code already exists', 409);
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
        const existing = await this.getSubjectById(id);
        const name = input.name?.trim() ?? existing.name;
        const code = input.code?.trim().toUpperCase() ?? existing.code;
        await this.ensureSubjectUnique(name, code, id);

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('subjects')
            .update({
                name,
                code,
                description: input.description !== undefined ? (input.description || null) : existing.description,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') throw new SubjectServiceError('Subject name or code already exists', 409);
            throw new SubjectServiceError('Failed to update subject', 500);
        }

        return data;
    }

    static async deleteSubject(id: string) {
        await this.getSubjectById(id);

        const supabase = await createClient();

        const checks = await Promise.all([
            supabase.from('subject_assignments').select('id', { count: 'exact', head: true }).eq('subject_id', id),
            supabase.from('timetable_entries').select('id', { count: 'exact', head: true }).eq('subject_id', id),
            supabase.from('homework').select('id', { count: 'exact', head: true }).eq('subject_id', id),
            supabase.from('exams').select('id', { count: 'exact', head: true }).eq('subject_id', id),
        ]);
        if (checks.some((check) => check.error)) throw new SubjectServiceError('Failed to check subject dependencies', 500);
        if (checks.some((check) => (check.count ?? 0) > 0)) throw new SubjectServiceError('Cannot delete subject with dependent records.', 409);
        const { error } = await supabase.from('subjects').delete().eq('id', id);

        if (error) {
            if (error.code === '23503') {
                throw new SubjectServiceError('Cannot delete subject with dependent records.', 409);
            }
            if (error.code === 'P0001') throw new SubjectServiceError('Cannot delete subject with dependent records.', 409);
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
            .order('code', { ascending: true })
            .order('name', { ascending: true });

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

import { createClient } from '@/lib/supabase/server';
import type { CreateHomeworkInput, UpdateHomeworkInput, ListHomeworkQuery } from './homework.validation';

export class HomeworkServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class HomeworkService {
    static async createHomework(input: CreateHomeworkInput) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('homework')
            .insert(input)
            .select('*')
            .single();

        if (error) throw new HomeworkServiceError('Failed to create homework', 500);
        return data;
    }

    static async getHomeworkById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('homework')
            .select(`
                *,
                class:classes(name),
                subject:subjects(name, code),
                teacher:teachers(full_name)
            `)
            .eq('id', id)
            .single();

        if (error || !data) throw new HomeworkServiceError('Homework not found', 404);
        return data;
    }

    static async updateHomework(id: string, input: UpdateHomeworkInput) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('homework')
            .update(input)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw new HomeworkServiceError('Failed to update homework', 500);
        return data;
    }

    static async deleteHomework(id: string) {
        const supabase = await createClient();
        const { error } = await supabase.from('homework').delete().eq('id', id);
        if (error) throw new HomeworkServiceError('Failed to delete homework', 500);
        return { success: true };
    }

    static async listHomework(query: ListHomeworkQuery) {
        const supabase = await createClient();
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let req = supabase
            .from('homework')
            .select(`
                *,
                class:classes(name),
                subject:subjects(name, code),
                teacher:teachers(full_name)
            `, { count: 'exact' })
            .order('created_at', { ascending: false });

        if (query.class_id) req = req.eq('class_id', query.class_id);
        if (query.teacher_id) req = req.eq('teacher_id', query.teacher_id);
        if (query.subject_id) req = req.eq('subject_id', query.subject_id);
        if (query.academic_year) req = req.eq('academic_year', query.academic_year);

        const { data, error, count } = await req.range(from, to);

        if (error) throw new HomeworkServiceError('Failed to list homework', 500);

        return {
            data: data ?? [],
            page,
            pageSize: PAGE_SIZE,
            total: count ?? 0,
            totalPages: count ? Math.ceil(count / PAGE_SIZE) : 1,
        };
    }
}

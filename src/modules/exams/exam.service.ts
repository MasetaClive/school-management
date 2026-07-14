import { createClient } from '@/lib/supabase/server';
import type {
    CreateExamInput,
    UpdateExamInput,
    ListExamsQuery,
} from './exam.validation';

export class ExamServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class ExamService {
    static async createExam(input: CreateExamInput) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('exams')
            .insert({
                name: input.name,
                class_id: input.class_id,
                subject_id: input.subject_id,
                exam_date: input.exam_date,
                max_marks: input.max_marks,
                academic_year: input.academic_year,
            })
            .select('*')
            .single();

        if (error) {
            throw new ExamServiceError('Failed to create exam', 500);
        }

        return data;
    }

    static async getExamById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('exams')
            .select(`
        *,
        class:classes(id, name, grade_level),
        subject:subjects(id, name, code)
      `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw new ExamServiceError('Failed to fetch exam', 500);
        if (!data) throw new ExamServiceError('Exam not found', 404);
        return data;
    }

    static async updateExam(id: string, input: UpdateExamInput) {
        const supabase = await createClient();

        // Check existence
        await this.getExamById(id);

        const { data, error } = await supabase
            .from('exams')
            .update({
                name: input.name,
                class_id: input.class_id,
                subject_id: input.subject_id,
                exam_date: input.exam_date,
                max_marks: input.max_marks,
                academic_year: input.academic_year,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new ExamServiceError('Failed to update exam', 500);
        }

        return data;
    }

    static async deleteExam(id: string) {
        const supabase = await createClient();

        // Check existence
        await this.getExamById(id);

        const { error } = await supabase.from('exams').delete().eq('id', id);

        if (error) {
            if (error.code === '23503') {
                throw new ExamServiceError('Cannot delete exam because it has results recorded', 409);
            }
            throw new ExamServiceError('Failed to delete exam', 500);
        }

        return { success: true };
    }

    static async listExams(query: ListExamsQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        let req = supabase
            .from('exams')
            .select(`
        *,
        class:classes(id, name, grade_level),
        subject:subjects(id, name, code)
      `, { count: 'exact' })
            .order('exam_date', { ascending: false });

        if (query.class_id) req = req.eq('class_id', query.class_id);
        if (query.subject_id) req = req.eq('subject_id', query.subject_id);

        const { data, error, count } = await req.range(from, to);

        if (error) {
            throw new ExamServiceError('Failed to fetch exams', 500);
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

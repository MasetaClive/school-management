import { createClient } from '@/lib/supabase/server';
import type {
    CreateResultInput,
    UpdateResultInput,
    ListResultsQuery,
} from './result.validation';

export class ResultServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class ResultService {
    static async createResult(input: CreateResultInput) {
        const supabase = await createClient();

        // 1. Check if exam exists and get max_marks
        const { data: exam, error: examError } = await supabase
            .from('exams')
            .select('max_marks')
            .eq('id', input.exam_id)
            .single();

        if (examError || !exam) {
            throw new ResultServiceError('Exam not found', 404);
        }

        // 2. Validate marks_obtained
        if (input.marks_obtained > exam.max_marks) {
            throw new ResultServiceError(`Marks obtained (${input.marks_obtained}) cannot exceed maximum marks (${exam.max_marks})`, 400);
        }

        // 3. Check for unique constraint: (exam_id, student_id)
        const { data: existing, error: checkError } = await supabase
            .from('results')
            .select('id')
            .eq('exam_id', input.exam_id)
            .eq('student_id', input.student_id)
            .maybeSingle();

        if (checkError) throw new ResultServiceError('Failed to validate result uniqueness', 500);
        if (existing) {
            throw new ResultServiceError('Result already exists for this student in this exam', 409);
        }

        // 4. Insert result
        const { data, error } = await supabase
            .from('results')
            .insert({
                exam_id: input.exam_id,
                student_id: input.student_id,
                marks_obtained: input.marks_obtained,
                grade: input.grade || null,
                remarks: input.remarks || null,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new ResultServiceError('Result already exists for this student', 409);
            }
            throw new ResultServiceError('Failed to record result', 500);
        }

        return data;
    }

    static async getResultById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('results')
            .select(`
        *,
        student:students(id, full_name, student_id),
        exam:exams(id, name, max_marks, subject:subjects(name))
      `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw new ResultServiceError('Failed to fetch result record', 500);
        if (!data) throw new ResultServiceError('Result record not found', 404);
        return data;
    }

    static async updateResult(id: string, input: UpdateResultInput) {
        const supabase = await createClient();

        // Fetch existing result to get exam info
        const existing = await this.getResultById(id);

        // If marks are being updated, validate against max_marks
        if (input.marks_obtained !== undefined) {
            if (input.marks_obtained > (existing.exam as any).max_marks) {
                throw new ResultServiceError(`Marks obtained (${input.marks_obtained}) cannot exceed maximum marks (${(existing.exam as any).max_marks})`, 400);
            }
        }

        const { data, error } = await supabase
            .from('results')
            .update({
                marks_obtained: input.marks_obtained ?? existing.marks_obtained,
                grade: input.grade !== undefined ? input.grade : existing.grade,
                remarks: input.remarks !== undefined ? input.remarks : existing.remarks,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new ResultServiceError('Failed to update result', 500);
        }

        return data;
    }

    static async deleteResult(id: string) {
        const supabase = await createClient();
        const { error } = await supabase.from('results').delete().eq('id', id);

        if (error) {
            throw new ResultServiceError('Failed to delete result record', 500);
        }

        return { success: true };
    }

    static async listResults(query: ListResultsQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        let req = supabase
            .from('results')
            .select(`
        *,
        student:students(id, full_name, student_id),
        exam:exams(id, name, exam_date)
      `, { count: 'exact' })
            .order('created_at', { ascending: false });

        if (query.student_id) req = req.eq('student_id', query.student_id);
        if (query.exam_id) req = req.eq('exam_id', query.exam_id);

        const { data, error, count } = await req.range(from, to);

        if (error) {
            throw new ResultServiceError('Failed to fetch results history', 500);
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

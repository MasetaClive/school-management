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
    private static calculateGrade(marks: number, maximum: number) {
        const percentage = (marks / maximum) * 100;
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    }

    private static async getEligibleExamAndStudent(examId: string, studentId: string) {
        const supabase = await createClient();
        const [exam, student] = await Promise.all([
            supabase.from('exams').select('id, max_marks, class_id, academic_year').eq('id', examId).maybeSingle(),
            supabase.from('students').select('id, class_id, academic_year').eq('id', studentId).maybeSingle(),
        ]);
        if (exam.error || student.error) throw new ResultServiceError('Failed to validate result relationships', 500);
        if (!exam.data) throw new ResultServiceError('Exam not found', 404);
        if (!student.data) throw new ResultServiceError('Student not found', 404);
        if (student.data.class_id !== exam.data.class_id || student.data.academic_year !== exam.data.academic_year) {
            throw new ResultServiceError('Student is not eligible for this exam', 409);
        }
        return { exam: exam.data, student: student.data };
    }
    static async createResult(input: CreateResultInput) {
        const { exam } = await this.getEligibleExamAndStudent(input.exam_id, input.student_id);
        const supabase = await createClient();

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
                grade: this.calculateGrade(input.marks_obtained, exam.max_marks),
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

        const existing = await this.getResultById(id);
        const { exam } = await this.getEligibleExamAndStudent(existing.exam_id, existing.student_id);

        // If marks are being updated, validate against max_marks
        if (input.marks_obtained !== undefined) {
            if (input.marks_obtained > exam.max_marks) {
                throw new ResultServiceError(`Marks obtained (${input.marks_obtained}) cannot exceed maximum marks (${exam.max_marks})`, 400);
            }
        }

        const { data, error } = await supabase
            .from('results')
            .update({
                marks_obtained: input.marks_obtained ?? existing.marks_obtained,
                grade: this.calculateGrade(input.marks_obtained ?? existing.marks_obtained, exam.max_marks),
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
        await this.getResultById(id);
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
        if (query.search) {
            const term = query.search.replace(/[,%_()]/g, '');
            if (!term) return { data: [], page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
            const pattern = `%${term}%`;
            const [students, exams] = await Promise.all([
                supabase.from('students').select('id').or(`full_name.ilike.${pattern},student_id.ilike.${pattern}`),
                supabase.from('exams').select('id').ilike('name', pattern),
            ]);
            if (students.error || exams.error) throw new ResultServiceError('Failed to search results', 500);
            const filters = [...(students.data ?? []).map(({ id }) => `student_id.eq.${id}`), ...(exams.data ?? []).map(({ id }) => `exam_id.eq.${id}`)];
            if (!filters.length) return { data: [], page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
            req = req.or(filters.join(','));
        }

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

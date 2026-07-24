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
    private static async ensureRelationshipsAreValid(
        classId: string, subjectId: string, teacherId: string, academicYear: string, examDate: string,
    ) {
        const supabase = await createClient();
        const [classRecord, subject, teacher, year, assignment, timetable] = await Promise.all([
            supabase.from('classes').select('id').eq('id', classId).maybeSingle(),
            supabase.from('subjects').select('id').eq('id', subjectId).maybeSingle(),
            supabase.from('teachers').select('id').eq('id', teacherId).maybeSingle(),
            supabase.from('academic_years').select('id, start_date, end_date, is_closed').eq('year', academicYear).maybeSingle(),
            supabase.from('subject_assignments').select('id').eq('class_id', classId).eq('subject_id', subjectId)
                .eq('teacher_id', teacherId).eq('academic_year', academicYear).maybeSingle(),
            supabase.from('timetable_entries').select('id').eq('class_id', classId).eq('subject_id', subjectId)
                .eq('teacher_id', teacherId).eq('academic_year', academicYear).limit(1).maybeSingle(),
        ]);
        if (classRecord.error || subject.error || teacher.error || year.error || assignment.error || timetable.error) {
            throw new ExamServiceError('Failed to validate exam relationships', 500);
        }
        if (!classRecord.data) throw new ExamServiceError('Class not found', 404);
        if (!subject.data) throw new ExamServiceError('Subject not found', 404);
        if (!teacher.data) throw new ExamServiceError('Teacher not found', 404);
        if (!year.data) throw new ExamServiceError('Academic year not found', 404);
        if (year.data.is_closed) throw new ExamServiceError('Cannot schedule an exam in a closed academic year', 409);
        if (!assignment.data) throw new ExamServiceError('A matching subject assignment is required for this exam', 409);
        if (!timetable.data) throw new ExamServiceError('A matching timetable entry is required for this exam', 409);
        if (year.data.start_date && examDate < year.data.start_date) throw new ExamServiceError('Exam date must fall within the academic year', 400);
        if (year.data.end_date && examDate > year.data.end_date) throw new ExamServiceError('Exam date must fall within the academic year', 400);
    }

    private static async ensureNoConflict(
        classId: string, subjectId: string, examDate: string, academicYear: string, excludeId?: string,
    ) {
        const supabase = await createClient();
        let request = supabase.from('exams').select('id').eq('class_id', classId).eq('subject_id', subjectId)
            .eq('exam_date', examDate).eq('academic_year', academicYear);
        if (excludeId) request = request.neq('id', excludeId);
        const { data, error } = await request.maybeSingle();
        if (error) throw new ExamServiceError('Failed to validate exam conflict', 500);
        if (data) throw new ExamServiceError('This class already has an exam for this subject on the selected date', 409);
    }

    static async createExam(input: CreateExamInput) {
        await this.ensureRelationshipsAreValid(input.class_id, input.subject_id, input.teacher_id, input.academic_year, input.exam_date);
        await this.ensureNoConflict(input.class_id, input.subject_id, input.exam_date, input.academic_year);
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('exams')
            .insert({
                name: input.name,
                class_id: input.class_id,
                subject_id: input.subject_id,
                teacher_id: input.teacher_id,
                exam_type: input.exam_type,
                exam_date: input.exam_date,
                max_marks: input.max_marks,
                academic_year: input.academic_year,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505' || error.code === 'P0001') throw new ExamServiceError(error.message || 'This exam conflicts with an existing exam', 409);
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
        ,teacher:teachers(id, full_name, teacher_id)
      `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw new ExamServiceError('Failed to fetch exam', 500);
        if (!data) throw new ExamServiceError('Exam not found', 404);
        return data;
    }

    static async updateExam(id: string, input: UpdateExamInput) {
        const existing = await this.getExamById(id);
        const classId = input.class_id ?? existing.class_id;
        const subjectId = input.subject_id ?? existing.subject_id;
        const teacherId = input.teacher_id ?? existing.teacher_id;
        const academicYear = input.academic_year ?? existing.academic_year;
        const examDate = input.exam_date ?? existing.exam_date;
        await this.ensureRelationshipsAreValid(classId, subjectId, teacherId, academicYear, examDate);
        await this.ensureNoConflict(classId, subjectId, examDate, academicYear, id);
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('exams')
            .update({
                name: input.name ?? existing.name,
                class_id: classId,
                subject_id: subjectId,
                teacher_id: teacherId,
                exam_type: input.exam_type ?? existing.exam_type,
                exam_date: examDate,
                max_marks: input.max_marks ?? existing.max_marks,
                academic_year: academicYear,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505' || error.code === 'P0001') throw new ExamServiceError(error.message || 'This exam conflicts with an existing exam', 409);
            throw new ExamServiceError('Failed to update exam', 500);
        }

        return data;
    }

    static async deleteExam(id: string) {
        const supabase = await createClient();

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
        id,
        name,
        class_id,
        subject_id,
        exam_date,
        max_marks,
        academic_year,
        created_at,
        class:classes(id, name, grade_level),
        subject:subjects(id, name, code)
      `, { count: 'exact' })
            .order('exam_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (query.class_id) req = req.eq('class_id', query.class_id);
        if (query.subject_id) req = req.eq('subject_id', query.subject_id);
        if (query.teacher_id) req = req.eq('teacher_id', query.teacher_id);
        if (query.academic_year) req = req.eq('academic_year', query.academic_year);
        if (query.exam_type) req = req.eq('exam_type', query.exam_type);
        if (query.exam_date) req = req.eq('exam_date', query.exam_date);

        if (query.search) {
            const term = query.search.replace(/[,%_()]/g, '');
            if (!term) return { data: [], page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
            const pattern = `%${term}%`;
            const [classes, subjects, teachers] = await Promise.all([
                supabase.from('classes').select('id').or(`name.ilike.${pattern},grade_level.ilike.${pattern}`),
                supabase.from('subjects').select('id').or(`name.ilike.${pattern},code.ilike.${pattern}`),
                supabase.from('teachers').select('id').or(`full_name.ilike.${pattern},teacher_id.ilike.${pattern}`),
            ]);
            if (classes.error || subjects.error || teachers.error) throw new ExamServiceError('Failed to search exams', 500);
            req = req.or([
                `name.ilike.${pattern}`,
                ...(classes.data ?? []).map(({ id }) => `class_id.eq.${id}`),
                ...(subjects.data ?? []).map(({ id }) => `subject_id.eq.${id}`),
                ...(teachers.data ?? []).map(({ id }) => `teacher_id.eq.${id}`),
            ].join(','));
        }

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

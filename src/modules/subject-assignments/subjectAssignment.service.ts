import { createClient } from '@/lib/supabase/server';
import type {
    CreateSubjectAssignmentInput,
    UpdateSubjectAssignmentInput,
    ListSubjectAssignmentsQuery,
} from './subjectAssignment.validation';

export class SubjectAssignmentServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class SubjectAssignmentService {
    static async checkDuplicate(
        teacher_id: string,
        subject_id: string,
        class_id: string,
        academic_year: string,
        excludeId?: string
    ) {
        const supabase = await createClient();
        let query = supabase
            .from('subject_assignments')
            .select('id')
            .eq('teacher_id', teacher_id)
            .eq('subject_id', subject_id)
            .eq('class_id', class_id)
            .eq('academic_year', academic_year);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw new SubjectAssignmentServiceError('Failed to validate assignment uniqueness', 500);
        if (data) throw new SubjectAssignmentServiceError('This subject is already assigned to this teacher in this class for the given year', 409);
    }

    static async createSubjectAssignment(input: CreateSubjectAssignmentInput) {
        const { teacher_id, subject_id, class_id, academic_year } = input;

        await this.checkDuplicate(teacher_id, subject_id, class_id, academic_year);

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('subject_assignments')
            .insert({
                teacher_id,
                subject_id,
                class_id,
                academic_year,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new SubjectAssignmentServiceError('This assignment already exists', 409);
            }
            throw new SubjectAssignmentServiceError('Failed to create assignment', 500);
        }

        return data;
    }

    static async getSubjectAssignmentById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('subject_assignments')
            .select(`
        *,
        teacher:teachers(id, full_name, teacher_id),
        subject:subjects(id, name, code),
        class:classes(id, name, grade_level)
      `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw new SubjectAssignmentServiceError('Failed to fetch assignment', 500);
        if (!data) throw new SubjectAssignmentServiceError('Assignment not found', 404);
        return data;
    }

    static async updateSubjectAssignment(id: string, input: UpdateSubjectAssignmentInput) {
        const existing = await this.getSubjectAssignmentById(id);

        const teacher_id = input.teacher_id ?? existing.teacher_id;
        const subject_id = input.subject_id ?? existing.subject_id;
        const class_id = input.class_id ?? existing.class_id;
        const academic_year = input.academic_year ?? existing.academic_year;

        if (
            input.teacher_id ||
            input.subject_id ||
            input.class_id ||
            input.academic_year
        ) {
            await this.checkDuplicate(teacher_id, subject_id, class_id, academic_year, id);
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('subject_assignments')
            .update({
                teacher_id,
                subject_id,
                class_id,
                academic_year,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new SubjectAssignmentServiceError('Failed to update assignment', 500);
        }

        return data;
    }

    static async deleteSubjectAssignment(id: string) {
        await this.getSubjectAssignmentById(id);

        const supabase = await createClient();
        const { error } = await supabase.from('subject_assignments').delete().eq('id', id);

        if (error) {
            throw new SubjectAssignmentServiceError('Failed to delete assignment', 500);
        }

        return { success: true };
    }

    static async listSubjectAssignments(query: ListSubjectAssignmentsQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        let req = supabase
            .from('subject_assignments')
            .select(`
        id,
        academic_year,
        created_at,
        teacher:teachers(id, full_name, teacher_id),
        subject:subjects(id, name, code),
        class:classes(id, name, grade_level)
      `, { count: 'exact' })
            .order('created_at', { ascending: false });

        if (query.teacher_id) req = req.eq('teacher_id', query.teacher_id);
        if (query.class_id) req = req.eq('class_id', query.class_id);
        if (query.subject_id) req = req.eq('subject_id', query.subject_id);

        const { data, error, count } = await req.range(from, to);

        if (error) {
            throw new SubjectAssignmentServiceError('Failed to fetch assignments', 500);
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

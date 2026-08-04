import { createClient } from '@/lib/supabase/server';
import { getSupabaseServerEnv } from '@/lib/supabase/config';
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
    private static ensureAttachmentIsHomeworkUpload(value: string | null | undefined) {
        if (!value) return;

        let attachment: URL;
        let supabaseUrl: URL;
        try {
            attachment = new URL(value);
            supabaseUrl = new URL(getSupabaseServerEnv().url);
        } catch {
            throw new HomeworkServiceError('Invalid homework attachment URL', 400);
        }

        if (
            attachment.origin !== supabaseUrl.origin ||
            !attachment.pathname.startsWith('/storage/v1/object/public/homework-attachments/')
        ) {
            throw new HomeworkServiceError('Homework attachments must be uploaded from your device', 400);
        }
    }

    private static normaliseDueDate(value: string) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) throw new HomeworkServiceError('Invalid due date', 400);
        return date.toISOString();
    }

    private static async ensureRelationshipsAreValid(
        classId: string,
        subjectId: string,
        teacherId: string,
        academicYear: string,
        dueDate: string,
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
            throw new HomeworkServiceError('Failed to validate homework relationships', 500);
        }
        if (!classRecord.data) throw new HomeworkServiceError('Class not found', 404);
        if (!subject.data) throw new HomeworkServiceError('Subject not found', 404);
        if (!teacher.data) throw new HomeworkServiceError('Teacher not found', 404);
        if (!year.data) throw new HomeworkServiceError('Academic year not found', 404);
        if (year.data.is_closed) throw new HomeworkServiceError('Cannot assign homework in a closed academic year', 409);
        if (!assignment.data) throw new HomeworkServiceError('A matching subject assignment is required for this class, subject, teacher, and academic year', 409);
        if (!timetable.data) throw new HomeworkServiceError('A matching timetable entry is required for this homework assignment', 409);

        const due = new Date(dueDate);
        if (year.data.start_date && due < new Date(`${year.data.start_date}T00:00:00.000Z`)) {
            throw new HomeworkServiceError('Due date must fall within the academic year', 400);
        }
        if (year.data.end_date && due > new Date(`${year.data.end_date}T23:59:59.999Z`)) {
            throw new HomeworkServiceError('Due date must fall within the academic year', 400);
        }
    }

    private static async ensureNoDuplicate(
        classId: string, subjectId: string, teacherId: string, title: string, dueDate: string, academicYear: string, excludeId?: string,
    ) {
        const supabase = await createClient();
        let request = supabase.from('homework').select('id').eq('class_id', classId).eq('subject_id', subjectId)
            .eq('teacher_id', teacherId).ilike('title', title).eq('due_date', dueDate).eq('academic_year', academicYear);
        if (excludeId) request = request.neq('id', excludeId);
        const { data, error } = await request.maybeSingle();
        if (error) throw new HomeworkServiceError('Failed to validate duplicate homework', 500);
        if (data) throw new HomeworkServiceError('An identical homework assignment already exists', 409);
    }

    static async createHomework(input: CreateHomeworkInput) {
        const dueDate = this.normaliseDueDate(input.due_date);
        this.ensureAttachmentIsHomeworkUpload(input.attachment_url);
        await this.ensureRelationshipsAreValid(input.class_id, input.subject_id, input.teacher_id, input.academic_year, dueDate);
        await this.ensureNoDuplicate(input.class_id, input.subject_id, input.teacher_id, input.title, dueDate, input.academic_year);
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('homework')
            .insert({ ...input, due_date: dueDate, description: input.description || null, attachment_url: input.attachment_url || null })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505' || error.code === 'P0001') throw new HomeworkServiceError(error.message || 'An identical homework assignment already exists', 409);
            throw new HomeworkServiceError('Failed to create homework', 500);
        }
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

        if (error) throw new HomeworkServiceError('Failed to fetch homework', 500);
        if (!data) throw new HomeworkServiceError('Homework not found', 404);
        return data;
    }

    static async updateHomework(id: string, input: UpdateHomeworkInput) {
        const existing = await this.getHomeworkById(id);
        const classId = input.class_id ?? existing.class_id;
        const subjectId = input.subject_id ?? existing.subject_id;
        const teacherId = input.teacher_id ?? existing.teacher_id;
        const academicYear = input.academic_year ?? existing.academic_year;
        const dueDate = this.normaliseDueDate(input.due_date ?? existing.due_date);
        const title = input.title ?? existing.title;
        this.ensureAttachmentIsHomeworkUpload(input.attachment_url);
        await this.ensureRelationshipsAreValid(classId, subjectId, teacherId, academicYear, dueDate);
        await this.ensureNoDuplicate(classId, subjectId, teacherId, title, dueDate, academicYear, id);
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('homework')
            .update({
                class_id: classId, subject_id: subjectId, teacher_id: teacherId, title,
                description: input.description !== undefined ? input.description || null : existing.description,
                due_date: dueDate, attachment_url: input.attachment_url !== undefined ? input.attachment_url || null : existing.attachment_url,
                academic_year: academicYear,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505' || error.code === 'P0001') throw new HomeworkServiceError(error.message || 'An identical homework assignment already exists', 409);
            throw new HomeworkServiceError('Failed to update homework', 500);
        }
        return data;
    }

    static async deleteHomework(id: string) {
        await this.getHomeworkById(id);
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
            .order('due_date', { ascending: true })
            .order('created_at', { ascending: false });

        if (query.class_id) req = req.eq('class_id', query.class_id);
        if (query.teacher_id) req = req.eq('teacher_id', query.teacher_id);
        if (query.subject_id) req = req.eq('subject_id', query.subject_id);
        if (query.academic_year) req = req.eq('academic_year', query.academic_year);
        if (query.due_before) req = req.lte('due_date', this.normaliseDueDate(query.due_before));
        if (query.due_after) req = req.gte('due_date', this.normaliseDueDate(query.due_after));

        if (query.search) {
            const term = query.search.replace(/[,%_()]/g, '');
            if (!term) return { data: [], page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
            const pattern = `%${term}%`;
            const [teachers, subjects, classes] = await Promise.all([
                supabase.from('teachers').select('id').or(`full_name.ilike.${pattern},teacher_id.ilike.${pattern}`),
                supabase.from('subjects').select('id').or(`name.ilike.${pattern},code.ilike.${pattern}`),
                supabase.from('classes').select('id').or(`name.ilike.${pattern},grade_level.ilike.${pattern}`),
            ]);
            if (teachers.error || subjects.error || classes.error) throw new HomeworkServiceError('Failed to search homework', 500);
            const filters = [
                `title.ilike.${pattern}`,
                ...(teachers.data ?? []).map(({ id }) => `teacher_id.eq.${id}`),
                ...(subjects.data ?? []).map(({ id }) => `subject_id.eq.${id}`),
                ...(classes.data ?? []).map(({ id }) => `class_id.eq.${id}`),
            ];
            req = req.or(filters.join(','));
        }

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

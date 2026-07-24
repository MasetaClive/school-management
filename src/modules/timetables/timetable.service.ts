import { createClient } from '@/lib/supabase/server';
import type {
    CreateTimetableInput,
    UpdateTimetableInput,
    ListTimetablesQuery,
} from './timetable.validation';

export class TimetableServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class TimetableService {
    private static async ensureReferencesAreValid(
        classId: string,
        subjectId: string,
        teacherId: string,
        timeSlotId: string,
        academicYear: string,
    ) {
        const supabase = await createClient();
        const [classRecord, timeSlot, year, assignment] = await Promise.all([
            supabase.from('classes').select('id').eq('id', classId).maybeSingle(),
            supabase.from('time_slots').select('id').eq('id', timeSlotId).maybeSingle(),
            supabase.from('academic_years').select('id, is_closed').eq('year', academicYear).maybeSingle(),
            supabase.from('subject_assignments').select('id')
                .eq('class_id', classId).eq('subject_id', subjectId).eq('teacher_id', teacherId)
                .eq('academic_year', academicYear).maybeSingle(),
        ]);

        if (classRecord.error || timeSlot.error || year.error || assignment.error) {
            throw new TimetableServiceError('Failed to validate timetable references', 500);
        }
        if (!classRecord.data) throw new TimetableServiceError('Class not found', 404);
        if (!timeSlot.data) throw new TimetableServiceError('Time slot not found', 404);
        if (!year.data) throw new TimetableServiceError('Academic year not found', 404);
        if (year.data.is_closed) throw new TimetableServiceError('Cannot schedule a closed academic year', 409);
        if (!assignment.data) {
            throw new TimetableServiceError('The selected teacher, subject, class, and academic year do not form a valid subject assignment', 409);
        }
    }

    private static async ensureNoSchedulingConflict(
        classId: string,
        teacherId: string,
        timeSlotId: string,
        academicYear: string,
        excludeId?: string,
    ) {
        const supabase = await createClient();
        let classConflict = supabase.from('timetable_entries').select('id')
            .eq('class_id', classId).eq('time_slot_id', timeSlotId).eq('academic_year', academicYear);
        let teacherConflict = supabase.from('timetable_entries').select('id')
            .eq('teacher_id', teacherId).eq('time_slot_id', timeSlotId).eq('academic_year', academicYear);

        if (excludeId) {
            classConflict = classConflict.neq('id', excludeId);
            teacherConflict = teacherConflict.neq('id', excludeId);
        }

        const [classResult, teacherResult] = await Promise.all([
            classConflict.maybeSingle(), teacherConflict.maybeSingle(),
        ]);
        if (classResult.error || teacherResult.error) {
            throw new TimetableServiceError('Failed to validate timetable conflicts', 500);
        }
        if (classResult.data) throw new TimetableServiceError('Class already has a schedule in this time slot', 409);
        if (teacherResult.data) throw new TimetableServiceError('Teacher is already scheduled in this time slot', 409);
    }

    static async createTimetableEntry(input: CreateTimetableInput) {
        await this.ensureReferencesAreValid(input.class_id, input.subject_id, input.teacher_id, input.time_slot_id, input.academic_year);
        await this.ensureNoSchedulingConflict(input.class_id, input.teacher_id, input.time_slot_id, input.academic_year);
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('timetable_entries')
            .insert({
                class_id: input.class_id,
                subject_id: input.subject_id,
                teacher_id: input.teacher_id,
                time_slot_id: input.time_slot_id,
                academic_year: input.academic_year,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new TimetableServiceError('This timetable entry conflicts with an existing class or teacher schedule', 409);
            }
            throw new TimetableServiceError('Failed to create timetable entry', 500);
        }

        return data;
    }

    static async getTimetableById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('timetable_entries')
            .select(`
        *,
        class:classes(id, name, grade_level),
        subject:subjects(id, name, code),
        teacher:teachers(id, full_name, teacher_id),
        time_slot:time_slots(id, day_of_week, start_time, end_time)
      `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw new TimetableServiceError('Failed to fetch timetable entry', 500);
        if (!data) throw new TimetableServiceError('Timetable entry not found', 404);
        return data;
    }

    static async updateTimetableEntry(id: string, input: UpdateTimetableInput) {
        const existingEntry = await this.getTimetableById(id);

        const class_id = input.class_id ?? existingEntry.class_id;
        const subject_id = input.subject_id ?? existingEntry.subject_id;
        const teacher_id = input.teacher_id ?? existingEntry.teacher_id;
        const time_slot_id = input.time_slot_id ?? existingEntry.time_slot_id;
        const academic_year = input.academic_year ?? existingEntry.academic_year;
        await this.ensureReferencesAreValid(class_id, subject_id, teacher_id, time_slot_id, academic_year);
        await this.ensureNoSchedulingConflict(class_id, teacher_id, time_slot_id, academic_year, id);
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('timetable_entries')
            .update({
                class_id,
                subject_id,
                teacher_id,
                time_slot_id,
                academic_year,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505' || error.code === 'P0001') {
                throw new TimetableServiceError(error.message || 'This timetable entry conflicts with an existing schedule', 409);
            }
            throw new TimetableServiceError('Failed to update timetable entry', 500);
        }

        return data;
    }

    static async deleteTimetableEntry(id: string) {
        await this.getTimetableById(id);
        const supabase = await createClient();
        const { error } = await supabase.from('timetable_entries').delete().eq('id', id);

        if (error) {
            throw new TimetableServiceError('Failed to delete timetable entry', 500);
        }

        return { success: true };
    }

    static async listTimetables(query: ListTimetablesQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        let req = supabase
            .from('timetable_entries')
            .select(`
        id,
        academic_year,
        created_at,
        class:classes(id, name, grade_level),
        subject:subjects(id, name, code),
        teacher:teachers(id, full_name, teacher_id),
        time_slot:time_slots(id, day_of_week, start_time, end_time)
      `, { count: 'exact' })
            .order('academic_year', { ascending: false })
            .order('time_slot_id', { ascending: true })
            .order('created_at', { ascending: false });

        if (query.class_id) req = req.eq('class_id', query.class_id);
        if (query.teacher_id) req = req.eq('teacher_id', query.teacher_id);
        if (query.subject_id) req = req.eq('subject_id', query.subject_id);
        if (query.time_slot_id) req = req.eq('time_slot_id', query.time_slot_id);
        if (query.academic_year) req = req.eq('academic_year', query.academic_year);

        if (query.day_of_week !== undefined) {
            const { data: slots, error: slotsError } = await supabase
                .from('time_slots').select('id').eq('day_of_week', query.day_of_week);
            if (slotsError) throw new TimetableServiceError('Failed to filter timetable days', 500);
            const slotIds = (slots ?? []).map(({ id }) => id);
            if (!slotIds.length) return { data: [], page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
            req = req.in('time_slot_id', slotIds);
        }

        if (query.search) {
            const term = query.search.replace(/[,%_()]/g, '');
            if (!term) return { data: [], page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
            const pattern = `%${term}%`;
            const [teachers, subjects, classes] = await Promise.all([
                supabase.from('teachers').select('id').or(`full_name.ilike.${pattern},teacher_id.ilike.${pattern}`),
                supabase.from('subjects').select('id').or(`name.ilike.${pattern},code.ilike.${pattern}`),
                supabase.from('classes').select('id').or(`name.ilike.${pattern},grade_level.ilike.${pattern}`),
            ]);
            if (teachers.error || subjects.error || classes.error) throw new TimetableServiceError('Failed to search timetables', 500);
            req = req.or([
                `academic_year.ilike.${pattern}`,
                ...(teachers.data ?? []).map(({ id }) => `teacher_id.eq.${id}`),
                ...(subjects.data ?? []).map(({ id }) => `subject_id.eq.${id}`),
                ...(classes.data ?? []).map(({ id }) => `class_id.eq.${id}`),
            ].join(','));
        }

        const { data, error, count } = await req.range(from, to);

        if (error) {
            throw new TimetableServiceError('Failed to fetch timetables', 500);
        }

        return {
            data: data ?? [],
            page,
            pageSize: PAGE_SIZE,
            total: count ?? 0,
            totalPages: count ? Math.ceil(count / PAGE_SIZE) : 1,
        };
    }

    static async getTimeSlots() {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('time_slots')
            .select('*')
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw new TimetableServiceError('Failed to fetch time slots', 500);
        return data;
    }
}

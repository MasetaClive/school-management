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
    static async createTimetableEntry(input: CreateTimetableInput) {
        const supabase = await createClient();

        // Check for conflict based on UNIQUE(class_id, time_slot_id, academic_year)
        const { data: existing, error: checkError } = await supabase
            .from('timetable_entries')
            .select('id')
            .eq('class_id', input.class_id)
            .eq('time_slot_id', input.time_slot_id)
            .eq('academic_year', input.academic_year)
            .maybeSingle();

        if (checkError) throw new TimetableServiceError('Failed to validate timetable entry', 500);
        if (existing) {
            throw new TimetableServiceError('Class already has a schedule in this time slot', 409);
        }

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
                throw new TimetableServiceError('Class already has a schedule in this time slot', 409);
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
        const supabase = await createClient();

        // Fetch existing logic to handle partial updates for unique check
        const existingEntry = await this.getTimetableById(id);

        const class_id = input.class_id ?? existingEntry.class_id;
        const time_slot_id = input.time_slot_id ?? existingEntry.time_slot_id;
        const academic_year = input.academic_year ?? existingEntry.academic_year;

        if (input.class_id || input.time_slot_id || input.academic_year) {
            const { data: conflict, error: checkError } = await supabase
                .from('timetable_entries')
                .select('id')
                .eq('class_id', class_id)
                .eq('time_slot_id', time_slot_id)
                .eq('academic_year', academic_year)
                .neq('id', id)
                .maybeSingle();

            if (checkError) throw new TimetableServiceError('Failed to validate timetable entry', 500);
            if (conflict) {
                throw new TimetableServiceError('Class already has a schedule in this time slot', 409);
            }
        }

        const { data, error } = await supabase
            .from('timetable_entries')
            .update({
                class_id,
                subject_id: input.subject_id ?? existingEntry.subject_id,
                teacher_id: input.teacher_id ?? existingEntry.teacher_id,
                time_slot_id,
                academic_year,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new TimetableServiceError('Failed to update timetable entry', 500);
        }

        return data;
    }

    static async deleteTimetableEntry(id: string) {
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
            .order('created_at', { ascending: false });

        if (query.class_id) req = req.eq('class_id', query.class_id);
        if (query.teacher_id) req = req.eq('teacher_id', query.teacher_id);
        if (query.subject_id) req = req.eq('subject_id', query.subject_id);
        if (query.time_slot_id) req = req.eq('time_slot_id', query.time_slot_id);

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

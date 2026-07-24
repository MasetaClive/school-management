import { createClient } from '@/lib/supabase/server';
import type {
    CreateTimeSlotInput,
    UpdateTimeSlotInput,
    ListTimeSlotsQuery,
} from './timeSlot.validation';

export class TimeSlotServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class TimeSlotService {
    static async ensureNoOverlap(dayOfWeek: number, startTime: string, endTime: string, excludeId?: string) {
        const supabase = await createClient();
        let query = supabase
            .from('time_slots')
            .select('id')
            .eq('day_of_week', dayOfWeek)
            .lt('start_time', endTime)
            .gt('end_time', startTime)
            .limit(1);
        if (excludeId) query = query.neq('id', excludeId);
        const { data, error } = await query.maybeSingle();
        if (error) throw new TimeSlotServiceError('Failed to validate time slot overlap', 500);
        if (data) throw new TimeSlotServiceError('Time slot overlaps an existing slot on this day', 409);
    }

    static async createTimeSlot(input: CreateTimeSlotInput) {
        await this.ensureNoOverlap(input.day_of_week, input.start_time, input.end_time);
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('time_slots')
            .insert({
                day_of_week: input.day_of_week,
                start_time: input.start_time,
                end_time: input.end_time,
            })
            .select('*')
            .single();

        if (error) {
            if (error.code === '23P01') throw new TimeSlotServiceError('Time slot overlaps an existing slot on this day', 409);
            throw new TimeSlotServiceError('Failed to create time slot', 500);
        }

        return data;
    }

    static async getTimeSlotById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('time_slots')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw new TimeSlotServiceError('Failed to fetch time slot', 500);
        if (!data) throw new TimeSlotServiceError('Time slot not found', 404);
        return data;
    }

    static async updateTimeSlot(id: string, input: UpdateTimeSlotInput) {
        const existing = await this.getTimeSlotById(id);
        const dayOfWeek = input.day_of_week ?? existing.day_of_week;
        const startTime = input.start_time ?? existing.start_time;
        const endTime = input.end_time ?? existing.end_time;
        if (endTime <= startTime) throw new TimeSlotServiceError('End time must be after start time', 400);
        await this.ensureNoOverlap(dayOfWeek, startTime, endTime, id);
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('time_slots')
            .update({
                day_of_week: dayOfWeek,
                start_time: startTime,
                end_time: endTime,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            if (error.code === '23P01') throw new TimeSlotServiceError('Time slot overlaps an existing slot on this day', 409);
            throw new TimeSlotServiceError('Failed to update time slot', 500);
        }

        return data;
    }

    static async deleteTimeSlot(id: string) {
        const supabase = await createClient();

        await this.getTimeSlotById(id);

        const { count, error: dependencyError } = await supabase
            .from('timetable_entries')
            .select('id', { count: 'exact', head: true })
            .eq('time_slot_id', id);
        if (dependencyError) throw new TimeSlotServiceError('Failed to check timetable dependencies', 500);
        if ((count ?? 0) > 0) throw new TimeSlotServiceError('Cannot delete time slot because it is used in the timetable', 409);

        const { error } = await supabase.from('time_slots').delete().eq('id', id);

        if (error) {
            if (error.code === '23503') {
                throw new TimeSlotServiceError('Cannot delete time slot because it is used in the timetable', 409);
            }
            if (error.code === 'P0001') throw new TimeSlotServiceError('Cannot delete time slot because it is used in the timetable', 409);
            throw new TimeSlotServiceError('Failed to delete time slot', 500);
        }

        return { success: true };
    }

    static async listTimeSlots(query: ListTimeSlotsQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        let request = supabase
            .from('time_slots')
            .select('*', { count: 'exact' })
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true });
        if (query.search) request = request.or(`start_time.eq.${query.search},end_time.eq.${query.search}`);
        const { data, error, count } = await request.range(from, to);

        if (error) {
            throw new TimeSlotServiceError('Failed to fetch time slots', 500);
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

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
    static async createTimeSlot(input: CreateTimeSlotInput) {
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
        const supabase = await createClient();

        // Check Existence
        await this.getTimeSlotById(id);

        const { data, error } = await supabase
            .from('time_slots')
            .update({
                day_of_week: input.day_of_week,
                start_time: input.start_time,
                end_time: input.end_time,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new TimeSlotServiceError('Failed to update time slot', 500);
        }

        return data;
    }

    static async deleteTimeSlot(id: string) {
        const supabase = await createClient();

        // Existence check
        await this.getTimeSlotById(id);

        const { error } = await supabase.from('time_slots').delete().eq('id', id);

        if (error) {
            if (error.code === '23503') {
                throw new TimeSlotServiceError('Cannot delete time slot because it is used in the timetable', 409);
            }
            throw new TimeSlotServiceError('Failed to delete time slot', 500);
        }

        return { success: true };
    }

    static async listTimeSlots(query: ListTimeSlotsQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        const { data, error, count } = await supabase
            .from('time_slots')
            .select('*', { count: 'exact' })
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true })
            .range(from, to);

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

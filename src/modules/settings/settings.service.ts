import { createClient } from '@/lib/supabase/server';
import type { UpdateSettingsInput } from './settings.validation';

export class SettingsServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class SettingsService {
    static async getSettings(key: 'school_info' | 'academic_config') {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .maybeSingle();
        
        if (error) throw new SettingsServiceError('Failed to fetch settings', 500);
        if (!data) throw new SettingsServiceError('Settings record not found', 404);
        return data.value;
    }

    static async updateSettings(input: UpdateSettingsInput) {
        const supabase = await createClient();
        if (input.key === 'academic_config') {
            const { data: year, error } = await supabase.from('academic_years').select('id').eq('year', input.value.current_year).maybeSingle();
            if (error) throw new SettingsServiceError('Failed to validate academic year', 500);
            if (!year) throw new SettingsServiceError('Academic year not found', 404);
        }
        const { data, error } = await supabase
            .from('settings')
            .upsert({ key: input.key, value: input.value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
            .select('*')
            .single();

        if (error) throw new SettingsServiceError('Failed to update settings', 500);
        return data;
    }

    static async listAll() {
        const supabase = await createClient();
        const { data, error } = await supabase.from('settings').select('*').in('key', ['school_info', 'academic_config']).order('key');
        if (error) {
            if (error.code === '42P01') {
                throw new SettingsServiceError('Settings database migration has not been applied', 503);
            }
            throw new SettingsServiceError('Failed to list settings', 500);
        }
        return data;
    }
}

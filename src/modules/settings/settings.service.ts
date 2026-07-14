import { createClient } from '@/lib/supabase/server';

export class SettingsServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class SettingsService {
    static async getSettings(key: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .single();
        
        if (error) return null;
        return data.value;
    }

    static async updateSettings(key: string, value: any) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('settings')
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
            .select('*')
            .single();

        if (error) throw new SettingsServiceError('Failed to update settings', 500);
        return data;
    }

    static async listAll() {
        const supabase = await createClient();
        const { data, error } = await supabase.from('settings').select('*');
        if (error) {
            console.error('[SettingsService] listAll error:', error);
            throw new SettingsServiceError('Failed to list settings', 500);
        }
        return data;
    }
}

import { createClient } from '@/lib/supabase/server';

export class AnnouncementServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class AnnouncementService {
    static async listActive() {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('is_published', true)
            .order('published_at', { ascending: false });
        
        if (error) throw new AnnouncementServiceError('Failed to fetch announcements', 500);
        return data;
    }

    static async listAll() {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new AnnouncementServiceError('Failed to fetch announcements', 500);
        return data;
    }

    static async create(input: { title: string; content: string; target_roles?: string[]; is_published?: boolean }) {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('announcements')
            .insert({ 
                ...input, 
                author_id: user?.id,
                published_at: input.is_published ? new Date().toISOString() : null 
            })
            .select('*')
            .single();

        if (error) throw new AnnouncementServiceError('Failed to create announcement', 500);
        return data;
    }

    static async toggleStatus(id: string, isPublished: boolean) {
        const supabase = await createClient();
        const { error } = await supabase
            .from('announcements')
            .update({ 
                is_published: isPublished,
                published_at: isPublished ? new Date().toISOString() : null
            })
            .eq('id', id);

        if (error) throw new AnnouncementServiceError('Failed to update announcement status', 500);
        return { success: true };
    }
}

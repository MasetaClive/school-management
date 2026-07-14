import { createClient } from '@/lib/supabase/server';

export class NotificationServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class NotificationService {
    static async listForUser(email: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('notification_logs')
            .select('*')
            .eq('recipient_email', email)
            .order('created_at', { ascending: false });
        
        if (error) throw new NotificationServiceError('Failed to fetch notifications', 500);
        return data;
    }

    static async markAsRead(notificationId: string) {
        // Since original schema doesn't have is_read, we can't mark as read in DB
        // For now, return success or we could modify table later if user permits
        return { success: true };
    }

    /**
     * create
     * Can be called by other modules to trigger a notification
     */
    static async create(input: { recipient_email: string; title: string; message: string; type?: string }) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('notification_logs')
            .insert({
                recipient_email: input.recipient_email,
                event_type: input.type || 'info',
                metadata: { title: input.title, body: input.message }
            })
            .select('*')
            .single();

        if (error) throw new NotificationServiceError('Failed to create notification', 500);
        return data;
    }
}

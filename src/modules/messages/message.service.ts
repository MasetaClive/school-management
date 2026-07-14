import { createClient } from '@/lib/supabase/server';
import type {
    CreateMessageInput,
    ListMessagesQuery,
} from './message.validation';

export class MessageServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class MessageService {
    static async sendMessage(senderId: string, input: CreateMessageInput) {
        const supabase = await createClient();

        // 1. Fetch sender and recipient roles
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, role')
            .in('id', [senderId, input.recipient_id]);

        if (userError || !users || users.length < 1) {
            throw new MessageServiceError('Users not found', 404);
        }

        const sender = users.find(u => u.id === senderId);
        const recipient = users.find(u => u.id === input.recipient_id);

        if (!sender) throw new MessageServiceError('Sender not found', 404);
        if (!recipient) throw new MessageServiceError('Recipient not found', 404);

        // 2. Permission Check
        if (sender.role !== 'admin') {
            if (sender.role === 'teacher') {
                if (!['student', 'parent'].includes(recipient.role)) {
                    throw new MessageServiceError('Teachers can only message students and parents', 403);
                }
            } else if (sender.role === 'student' || sender.role === 'parent') {
                if (recipient.role !== 'teacher') {
                    throw new MessageServiceError(`${sender.role.charAt(0).toUpperCase() + sender.role.slice(1)}s can only message teachers`, 403);
                }
            } else {
                throw new MessageServiceError('Unauthorized role', 403);
            }
        }
        // Admins can message anyone

        // 2. Insert message
        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: senderId,
                recipient_id: input.recipient_id,
                subject: input.subject || null,
                body: input.body,
                is_read: false,
            })
            .select('*')
            .single();

        if (error) {
            throw new MessageServiceError('Failed to send message', 500);
        }

        return data;
    }

    static async getInbox(userId: string, query: ListMessagesQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        const { data, error, count } = await supabase
            .from('messages')
            .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, role)
      `, { count: 'exact' })
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            throw new MessageServiceError('Failed to fetch inbox', 500);
        }

        return {
            data: data ?? [],
            page,
            pageSize: PAGE_SIZE,
            total: count ?? 0,
            totalPages: count ? Math.ceil(count / PAGE_SIZE) : 1,
        };
    }

    static async getSentMessages(userId: string, query: ListMessagesQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        const { data, error, count } = await supabase
            .from('messages')
            .select(`
        *,
        recipient:users!messages_recipient_id_fkey(id, full_name, role)
      `, { count: 'exact' })
            .eq('sender_id', userId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            throw new MessageServiceError('Failed to fetch sent messages', 500);
        }

        return {
            data: data ?? [],
            page,
            pageSize: PAGE_SIZE,
            total: count ?? 0,
            totalPages: count ? Math.ceil(count / PAGE_SIZE) : 1,
        };
    }

    static async getMessageById(id: string, userId: string) {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('messages')
            .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, role),
        recipient:users!messages_recipient_id_fkey(id, full_name, role)
      `)
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new MessageServiceError('Message not found', 404);
        }

        // Security check: Only sender or recipient can access
        if (data.sender_id !== userId && data.recipient_id !== userId) {
            throw new MessageServiceError('Forbidden', 403);
        }

        // Mark as read if user is recipient and it's unread
        if (data.recipient_id === userId && !data.is_read) {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', id);

            data.is_read = true;
        }

        return data;
    }

    static async markAsRead(id: string, userId: string) {
        const supabase = await createClient();

        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('id', id)
            .eq('recipient_id', userId);

        if (error) {
            throw new MessageServiceError('Failed to mark message as read', 500);
        }

        return { success: true };
    }

    static async deleteMessage(id: string, userId: string) {
        const supabase = await createClient();

        // Security check: Only sender or recipient can delete
        const { data, error: fetchError } = await supabase
            .from('messages')
            .select('sender_id, recipient_id')
            .eq('id', id)
            .maybeSingle();

        if (fetchError || !data) {
            throw new MessageServiceError('Message not found', 404);
        }

        if (data.sender_id !== userId && data.recipient_id !== userId) {
            throw new MessageServiceError('Forbidden', 403);
        }

        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) {
            throw new MessageServiceError('Failed to delete message', 500);
        }

        return { success: true };
    }

    static async listUsers(currentUserRole: string, search?: string) {
        const supabase = await createClient();

        let query = supabase
            .from('users')
            .select('id, full_name, role')
            .order('full_name', { ascending: true });

        // 1. Apply Search Filter
        if (search) {
            query = query.ilike('full_name', `%${search}%`);
        }

        // 2. Apply Role-Based Visibility Filters
        if (currentUserRole !== 'admin') {
            if (currentUserRole === 'teacher') {
                // Teachers can message students and parents
                query = query.in('role', ['student', 'parent']);
            } else if (currentUserRole === 'student' || currentUserRole === 'parent') {
                // Students and parents can only message teachers
                query = query.eq('role', 'teacher');
            } else {
                // Other roles see nothing by default
                return [];
            }
        }

        const { data, error } = await query;

        if (error) {
            throw new MessageServiceError('Failed to fetch user list', 500);
        }

        return data ?? [];
    }
}

import { createClient } from '@/lib/supabase/server';
import { UserService } from '@/modules/users/user.service';
import type {
    CreateParentInput,
    UpdateParentInput,
    ListParentsQuery,
} from './parent.validation';

export class ParentServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

const PAGE_SIZE = 20;

export class ParentService {
    static async ensureParentIdUnique(parent_id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('parents')
            .select('id')
            .eq('parent_id', parent_id)
            .maybeSingle();

        if (error) throw new ParentServiceError('Failed to validate parent_id', 500);
        if (data) throw new ParentServiceError('Parent ID already exists', 400);
    }

    static async createParent(input: CreateParentInput) {
        const { parent_id, full_name, phone, email: inputEmail, address, occupation, create_account, password_mode: _passwordMode, password } = input;

        await this.ensureParentIdUnique(parent_id);

        const supabase = await createClient();
        let account = null;

        if (create_account) {
            account = await UserService.provisionAccount({
                role: 'parent',
                username: inputEmail || parent_id,
                fullName: full_name,
                email: inputEmail || null,
                password,
            });
        }

        const { data: parent, error: parentError } = await supabase
            .from('parents')
            .insert({
                user_id: account?.userId ?? null,
                parent_id,
                full_name,
                phone,
                email: inputEmail || null,
                address: address || null,
                occupation: occupation || null,
            })
            .select('*')
            .single();

        if (parentError) {
            if (account) await UserService.rollbackProvisionedAccount(account.userId);
            if (parentError.code === '23505') {
                throw new ParentServiceError('Parent ID already exists', 400);
            }
            throw new ParentServiceError(`Failed to create parent: ${parentError.message}`, 500);
        }

        return { profile: parent, account };
    }

    static async getParentById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('parents')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw new ParentServiceError('Failed to fetch parent', 500);
        if (!data) throw new ParentServiceError('Parent not found', 404);
        return data;
    }

    static async updateParent(id: string, input: UpdateParentInput) {
        const existing = await this.getParentById(id);

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('parents')
            .update({
                full_name: input.full_name ?? existing.full_name,
                phone: input.phone ?? existing.phone,
                email: input.email !== undefined ? (input.email || null) : existing.email,
                address: input.address !== undefined ? (input.address || null) : existing.address,
                occupation: input.occupation !== undefined ? (input.occupation || null) : existing.occupation,
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new ParentServiceError('Failed to update parent', 500);
        }

        return data;
    }

    static async hasLinkedStudents(parentId: string) {
        const supabase = await createClient();
        const { count, error } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('parent_id', parentId);

        if (error) {
            throw new ParentServiceError('Failed to check linked students', 500);
        }
        return (count ?? 0) > 0;
    }

    static async deleteParent(id: string) {
        const parent = await this.getParentById(id);

        const supabase = await createClient();

        if (await this.hasLinkedStudents(id)) {
            throw new ParentServiceError('Cannot delete parent with linked students', 409);
        }

        const { error } = await supabase.from('parents').delete().eq('id', id);

        if (error) {
            throw new ParentServiceError('Failed to delete parent', 500);
        }

        if (parent.user_id) {
            await UserService.rollbackProvisionedAccount(parent.user_id);
        }

        return { success: true };
    }

    static async listParents(query: ListParentsQuery) {
        const page = query.page ?? 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const supabase = await createClient();

        let req = supabase
            .from('parents')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (query.search) {
            req = req.or(
                `full_name.ilike.%${query.search}%,parent_id.ilike.%${query.search}%,email.ilike.%${query.search}%,phone.ilike.%${query.search}%`,
            );
        }

        const { data, error, count } = await req.range(from, to);

        if (error) {
            throw new ParentServiceError('Failed to fetch parents', 500);
        }

        return {
            data: data ?? [],
            page,
            pageSize: PAGE_SIZE,
            total: count ?? 0,
            totalPages: count ? Math.ceil(count / PAGE_SIZE) : 1,
        };
    }

    static async getDashboardData(userId: string) {
        const supabase = await createClient();
        const { data: parent, error: parentError } = await supabase
            .from('parents')
            .select('id, parent_id, full_name, email, phone')
            .eq('user_id', userId)
            .maybeSingle();

        if (parentError) throw new ParentServiceError('Failed to fetch parent profile', 500);
        if (!parent) throw new ParentServiceError('Parent profile not found', 404);

        const { data: children, error: childrenError } = await supabase
            .from('students')
            .select('id, student_id, full_name')
            .eq('parent_id', parent.id)
            .order('full_name');

        if (childrenError) throw new ParentServiceError('Failed to fetch linked children', 500);

        return { parent, children: children ?? [] };
    }
}

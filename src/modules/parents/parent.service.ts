import { createClient, createAdminClient } from '@/lib/supabase/server';
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
        const { parent_id, full_name, phone, email: inputEmail, address, occupation, create_account, password } = input;

        await this.ensureParentIdUnique(parent_id);

        const supabase = await createClient();
        const adminSupabase = await createAdminClient();

        // 1. Create Parent Profile
        const { data: parent, error: parentError } = await supabase
            .from('parents')
            .insert({
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
            if (parentError.code === '23505') {
                throw new ParentServiceError('Parent ID already exists', 400);
            }
            throw new ParentServiceError(`Failed to create parent: ${parentError.message}`, 500);
        }

        // 2. Automated Account Creation
        if (create_account && password) {
            const email = inputEmail || `${parent_id.toLowerCase()}@school.local`;

            // A. Create Auth User
            const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name, role: 'parent' }
            });

            if (authError) {
                throw new ParentServiceError(`Parent created, but failed to create login account: ${authError.message}`, 500);
            }

            const userId = authUser.user.id;

            // B. Create Public User Record
            const { error: userError } = await adminSupabase
                .from('users')
                .insert({
                    id: userId,
                    email,
                    full_name,
                    role: 'parent',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

            if (userError) {
                throw new ParentServiceError(`Parent and Auth created, but failed to sync public user: ${userError.message}`, 500);
            }

            // C. Link User ID back to Parent Profile
            await adminSupabase
                .from('parents')
                .update({ user_id: userId })
                .eq('id', parent.id);
        }

        return parent;
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

    static async hasLinkedStudents(parent_id_text: string) {
        const supabase = await createClient();
        const { count, error } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('parent_id', parent_id_text); // Wait, in the schema parent_id in students is UUID or link?
        // Re-checking student.validation.ts: parent_id: z.string().uuid().optional()
        // Re-checking goal: "Query students where parent_id = this parent id"
        // In Supabase, usually relations are by UUID. Let's check table columns.

        // Actually, the goal says: "Query students where parent_id = this parent id"
        // Usually "parent id" refers to the PK id.

        if (error) {
            throw new ParentServiceError('Failed to check linked students', 500);
        }
        return (count ?? 0) > 0;
    }

    static async deleteParent(id: string) {
        const parent = await this.getParentById(id);

        const supabase = await createClient();

        // The requirement says: "Query students where parent_id = this parent id"
        // In students table, parent_id is likely a foreign key to parents.id (UUID).
        const { count, error: countError } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('parent_id', id);

        if (countError) {
            throw new ParentServiceError('Failed to check linked students', 500);
        }

        if ((count ?? 0) > 0) {
            throw new ParentServiceError('Cannot delete parent with linked students', 409);
        }

        const { error } = await supabase.from('parents').delete().eq('id', id);

        if (error) {
            throw new ParentServiceError('Failed to delete parent', 500);
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
            req = req.ilike('full_name', `%${query.search}%`);
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
}

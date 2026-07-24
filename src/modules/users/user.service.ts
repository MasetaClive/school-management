import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { CreateUserInput, ListUsersQuery } from './user.validation';
import { randomBytes } from 'crypto';

export type AccountProvisionInput = {
  role: 'student' | 'teacher' | 'parent';
  username: string;
  fullName: string;
  email?: string | null;
  password?: string;
};

export type ProvisionedAccount = {
  userId: string;
  username: string;
  initialPassword: string;
};

export class UserServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'UserServiceError';
  }
}

export class UserService {
  static generateTemporaryPassword() {
    return `${randomBytes(12).toString('base64url')}Aa1!`;
  }

  static async provisionAccount(input: AccountProvisionInput): Promise<ProvisionedAccount> {
    const supabase = await createAdminClient();
    const initialPassword = input.password || this.generateTemporaryPassword();
    const authEmail = input.email || `${input.username.toLowerCase()}@school.local`;
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: authEmail,
      password: initialPassword,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        role: input.role,
        force_password_change: true,
      },
    });

    if (authError || !authUser.user) {
      throw new UserServiceError(authError?.message || 'Failed to create login account', 500);
    }

    const { error: userError } = await supabase.from('users').insert({
      id: authUser.user.id,
      email: authEmail,
      full_name: input.fullName,
      role: input.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (userError) {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new UserServiceError(`Failed to create user profile: ${userError.message}`, 500);
    }

    return { userId: authUser.user.id, username: input.username, initialPassword };
  }

  static async rollbackProvisionedAccount(userId: string) {
    const supabase = await createAdminClient();
    await supabase.from('users').delete().eq('id', userId);
    await supabase.auth.admin.deleteUser(userId);
  }

  static async getUsers(query: ListUsersQuery) {
    const supabase = await createClient();
    const { page = 1, search, role } = query;
    const limit = 10;
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (search) {
      dbQuery = dbQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role) {
      dbQuery = dbQuery.eq('role', role);
    }

    const { data, error, count } = await dbQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw new UserServiceError(error.message, 500);

    return {
      data,
      total: count ?? 0,
      page,
      limit,
    };
  }

  static async createUser(input: CreateUserInput) {
    const supabase = await createAdminClient();
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new UserServiceError('Email already exists', 409);
      throw new UserServiceError(error.message, 500);
    }

    return data;
  }

  static async getUnlinkedEntities() {
    const supabase = await createClient();
    
    const [students, teachers, parents] = await Promise.all([
      supabase.from('students').select('id, full_name').is('user_id', null),
      supabase.from('teachers').select('id, full_name').is('user_id', null),
      supabase.from('parents').select('id, full_name').is('user_id', null),
    ]);

    return {
      students: students.data || [],
      teachers: teachers.data || [],
      parents: parents.data || [],
    };
  }

  static async getUser(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new UserServiceError(error.message, 404);
    return data;
  }

  static async updateUser(id: string, input: Partial<CreateUserInput>) {
    console.log('[UserService.updateUser] Updating user:', id);
    const supabase = await createAdminClient();

    const updateData: any = {
        updated_at: new Date().toISOString(),
    };

    if (input.email !== undefined) updateData.email = input.email;
    if (input.full_name !== undefined) updateData.full_name = input.full_name;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.avatar_url !== undefined) updateData.avatar_url = input.avatar_url;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
       console.error('[UserService.updateUser] SUPABASE UPDATE ERROR:', error);
       if (error.code === '23505') throw new UserServiceError('Email already exists', 409);
       throw new UserServiceError(`Failed to update user: ${error.message}`, 500);
    }

    return data;
  }

  static async deleteUser(id: string) {
    const supabase = await createAdminClient();
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw new UserServiceError(error.message, 500);
    return { success: true };
  }
}

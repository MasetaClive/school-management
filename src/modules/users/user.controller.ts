import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import {
  createUserSchema,
  listUsersQuerySchema,
} from './user.validation';
import { UserService, UserServiceError } from './user.service';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function ensureAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('Unauthorized', 401);

  const role = await getUserRole();
  if (role !== 'admin') throw new ApiError('Forbidden', 403);
}

function toJsonError(e: unknown) {
  // eslint-disable-next-line no-console
  console.error('[users] Error caught in controller:', e);
  
  if (e instanceof ApiError || e instanceof UserServiceError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  if (e instanceof Error && e.name === 'ZodError') {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 },
  );
}

export const UserController = {
  async list(req: NextRequest) {
    try {
      await ensureAdmin();

      const url = new URL(req.url);
      const query = listUsersQuerySchema.parse({
        page: url.searchParams.get('page') ?? undefined,
        search: url.searchParams.get('search') ?? undefined,
        role: url.searchParams.get('role') ?? undefined,
      });

      const result = await UserService.getUsers(query);
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      return toJsonError(e);
    }
  },

  async create(req: NextRequest) {
    try {
      await ensureAdmin();
      const body = await req.json();
      const input = createUserSchema.parse(body);

      const user = await UserService.createUser(input);
      return NextResponse.json(user, { status: 201 });
    } catch (e) {
      return toJsonError(e);
    }
  },

  async delete(req: NextRequest, id: string) {
    try {
      await ensureAdmin();
      const result = await UserService.deleteUser(id);
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      return toJsonError(e);
    }
  },
  
  async update(req: NextRequest, id: string) {
    try {
      await ensureAdmin();
      const body = await req.json();
      console.log('[UserController] Updating user:', id, body);
      // Using partial validation for updates
      const result = await UserService.updateUser(id, body);
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      return toJsonError(e);
    }
  },

  async getUnlinked(req: NextRequest) {
    try {
      await ensureAdmin();
      const result = await UserService.getUnlinkedEntities();
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      return toJsonError(e);
    }
  },
};

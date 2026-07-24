import { NextRequest, NextResponse } from 'next/server';
import { SettingsService, SettingsServiceError } from './settings.service';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { updateSettingsSchema } from './settings.validation';

class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
async function ensureAdmin() { if (!(await getCurrentUser())) throw new ApiError('Unauthorized', 401); if (await getUserRole() !== 'admin') throw new ApiError('Forbidden', 403); }

function toJsonError(e: unknown) {
    if (e instanceof SettingsServiceError || e instanceof ApiError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[settings] unexpected error:', e);
    if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export const SettingsController = {
    async list(req: NextRequest) {
        try {
            await ensureAdmin();
            const data = await SettingsService.listAll();
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async update(req: NextRequest) {
        try {
            await ensureAdmin();
            const data = await SettingsService.updateSettings(updateSettingsSchema.parse(await req.json()));
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    }
};

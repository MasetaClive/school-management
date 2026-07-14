import { NextRequest, NextResponse } from 'next/server';
import { SettingsService, SettingsServiceError } from './settings.service';

function toJsonError(e: unknown) {
    if (e instanceof SettingsServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    // eslint-disable-next-line no-console
    console.error('[settings] unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error', details: e instanceof Error ? e.message : String(e) }, { status: 500 });
}

export const SettingsController = {
    async list(req: NextRequest) {
        try {
            const data = await SettingsService.listAll();
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async update(req: NextRequest) {
        try {
            const body = await req.json(); // { key, value }
            const data = await SettingsService.updateSettings(body.key, body.value);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    }
};

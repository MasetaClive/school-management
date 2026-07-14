import { NextRequest } from 'next/server';
import { SettingsRoutes } from '@/modules/settings/settings.routes';

export async function GET(req: NextRequest) {
    return SettingsRoutes.LIST(req);
}

export async function POST(req: NextRequest) {
    return SettingsRoutes.UPDATE(req);
}

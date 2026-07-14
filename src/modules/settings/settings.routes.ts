import { NextRequest } from 'next/server';
import { SettingsController } from './settings.controller';

export const SettingsRoutes = {
    async LIST(req: NextRequest) {
        return SettingsController.list(req);
    },
    async UPDATE(req: NextRequest) {
        return SettingsController.update(req);
    }
};

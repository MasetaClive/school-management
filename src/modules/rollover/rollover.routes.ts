import { NextRequest } from 'next/server';
import { RolloverController } from './rollover.controller';

export const RolloverRoutes = {
    async GET_STUDENTS(req: NextRequest) {
        return RolloverController.getStudents(req);
    },
    async PROMOTE(req: NextRequest) {
        return RolloverController.promote(req);
    }
};

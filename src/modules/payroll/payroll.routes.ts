import { NextRequest } from 'next/server';
import { PayrollController } from './payroll.controller';

export const PayrollRoutes = {
    async SET_CONFIG(req: NextRequest) {
        return PayrollController.setConfig(req);
    },
    async LIST_CONFIGS(req: NextRequest) {
        return PayrollController.listConfigs(req);
    },
    async GENERATE(req: NextRequest) {
        return PayrollController.generate(req);
    },
    async LIST_HISTORY(req: NextRequest) {
        return PayrollController.listHistory(req);
    }
};

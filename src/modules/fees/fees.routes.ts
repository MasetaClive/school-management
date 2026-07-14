import { NextRequest } from 'next/server';
import { FeesController } from './fees.controller';

export const FeesRoutes = {
    async CREATE_TYPE(req: NextRequest) {
        return FeesController.createFeeType(req);
    },
    async LIST_TYPES(req: NextRequest) {
        return FeesController.listFeeTypes(req);
    },
    async ASSIGN_FEE(req: NextRequest) {
        return FeesController.assignFee(req);
    },
    async RECORD_PAYMENT(req: NextRequest) {
        return FeesController.recordPayment(req);
    },
    async GET_STUDENT_FEES(req: NextRequest, { params }: { params: { studentId: string } }) {
        return FeesController.getStudentFees(req, params.studentId);
    }
};

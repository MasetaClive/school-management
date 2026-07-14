import { NextRequest } from 'next/server';
import { TransportController } from './transport.controller';

export const TransportRoutes = {
    async LIST_ROUTES(req: NextRequest) {
        return TransportController.listRoutes(req);
    },
    async CREATE_ROUTE(req: NextRequest) {
        return TransportController.createRoute(req);
    },
    async ASSIGN_STUDENT(req: NextRequest) {
        return TransportController.assignStudent(req);
    },
    async LIST_ASSIGNMENTS(req: NextRequest) {
        return TransportController.listAssignments(req);
    }
};

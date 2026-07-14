import { NextRequest } from 'next/server';
import { HomeworkController } from './homework.controller';

export const HomeworkRoutes = {
    async CREATE(req: NextRequest) {
        return HomeworkController.create(req);
    },
    async LIST(req: NextRequest) {
        return HomeworkController.list(req);
    },
    async GET_BY_ID(req: NextRequest, { params }: { params: { id: string } }) {
        return HomeworkController.getById(req, params.id);
    },
    async UPDATE(req: NextRequest, { params }: { params: { id: string } }) {
        return HomeworkController.update(req, params.id);
    },
    async DELETE(req: NextRequest, { params }: { params: { id: string } }) {
        return HomeworkController.delete(req, params.id);
    }
};

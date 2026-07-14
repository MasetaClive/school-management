import { NextRequest } from 'next/server';
import { HomeworkRoutes } from '@/modules/homework/homework.routes';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return HomeworkRoutes.GET_BY_ID(req, { params: await params });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return HomeworkRoutes.UPDATE(req, { params: await params });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return HomeworkRoutes.DELETE(req, { params: await params });
}

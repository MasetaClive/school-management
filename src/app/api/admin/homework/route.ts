import { NextRequest } from 'next/server';
import { HomeworkRoutes } from '@/modules/homework/homework.routes';

export async function GET(req: NextRequest) {
    return HomeworkRoutes.LIST(req);
}

export async function POST(req: NextRequest) {
    return HomeworkRoutes.CREATE(req);
}

import {
    listResultsRoute,
    createResultRoute,
} from '@/modules/results/result.routes';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return listResultsRoute(req);
}

export async function POST(req: NextRequest) {
    return createResultRoute(req);
}

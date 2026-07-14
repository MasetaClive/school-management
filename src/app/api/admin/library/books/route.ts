import { NextRequest } from 'next/server';
import { LibraryRoutes } from '@/modules/library/library.routes';

export async function GET(req: NextRequest) {
    return LibraryRoutes.LIST_BOOKS(req);
}

export async function POST(req: NextRequest) {
    return LibraryRoutes.ADD_BOOK(req);
}

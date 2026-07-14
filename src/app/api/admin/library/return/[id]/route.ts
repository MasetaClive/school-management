import { NextRequest } from 'next/server';
import { LibraryRoutes } from '@/modules/library/library.routes';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return LibraryRoutes.RETURN(req, { params: await params });
}

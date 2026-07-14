import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { LibraryService, LibraryServiceError } from './library.service';

function toJsonError(e: unknown) {
    if (e instanceof LibraryServiceError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error('[library] unexpected error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

async function ensureRole(roles: string[]) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    const role = await getUserRole();
    if (!role || !roles.includes(role)) throw new Error('Forbidden');
    return { user, role };
}

export const LibraryController = {
    async listBooks(req: NextRequest) {
        try {
            const url = new URL(req.url);
            const query = url.searchParams.get('q') || undefined;
            const data = await LibraryService.listBooks(query);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async addBook(req: NextRequest) {
        try {
            await ensureRole(['admin']);
            const body = await req.json();
            const data = await LibraryService.addBook(body);
            return NextResponse.json(data, { status: 201 });
        } catch (e) {
            return toJsonError(e);
        }
    },

    async borrow(req: NextRequest) {
        try {
            await ensureRole(['admin']);
            const body = await req.json();
            const data = await LibraryService.borrowBook(body.book_id, body.student_id);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async return(req: NextRequest, recordId: string) {
        try {
            await ensureRole(['admin']);
            const data = await LibraryService.returnBook(recordId);
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    },

    async listRecords(req: NextRequest) {
        try {
            await ensureRole(['admin']);
            const data = await LibraryService.listBorrowRecords();
            return NextResponse.json(data);
        } catch (e) {
            return toJsonError(e);
        }
    }
};

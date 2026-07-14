import { NextRequest } from 'next/server';
import { LibraryController } from './library.controller';

export const LibraryRoutes = {
    async LIST_BOOKS(req: NextRequest) {
        return LibraryController.listBooks(req);
    },
    async ADD_BOOK(req: NextRequest) {
        return LibraryController.addBook(req);
    },
    async BORROW(req: NextRequest) {
        return LibraryController.borrow(req);
    },
    async RETURN(req: NextRequest, { params }: { params: { id: string } }) {
        return LibraryController.return(req, params.id);
    },
    async LIST_RECORDS(req: NextRequest) {
        return LibraryController.listRecords(req);
    }
};

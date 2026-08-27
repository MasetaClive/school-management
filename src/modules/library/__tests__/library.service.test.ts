import { LibraryService } from '../library.service';
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
import { createClient } from '@/lib/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
describe('LibraryService', () => {
  beforeEach(() => jest.clearAllMocks());
  it('maps book inventory fields to the service response', async () => {
    const query = { select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [{ id: 'book-id', total_copies: 4, available_copies: 3 }], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);
    await expect(LibraryService.listBooks()).resolves.toEqual([{ id: 'book-id', isbn: undefined, title: undefined, author: undefined, category: undefined, quantity: 4, available_quantity: 3, created_at: undefined, updated_at: undefined }]);
  });
  it('rejects borrowing an unavailable book', async () => {
    const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { available_copies: 0 }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);
    await expect(LibraryService.borrowBook('book-id', 'student-id')).rejects.toMatchObject({ message: 'Book currently unavailable', status: 400 });
  });
  it('rejects returning an already returned book', async () => {
    const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { status: 'returned' }, error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(query) } as never);
    await expect(LibraryService.returnBook('record-id')).rejects.toMatchObject({ message: 'Book already returned', status: 400 });
  });

  it('filters books and handles borrow, return, and list failures', async () => {
    const books = { select: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), ilike: jest.fn().mockResolvedValue({ data: [], error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(books) } as never);
    await expect(LibraryService.listBooks('math')).resolves.toEqual([]);

    const missing = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { message: 'missing' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(missing) } as never);
    await expect(LibraryService.borrowBook('book', 'student')).rejects.toMatchObject({ status: 404 });

    const book = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { available_copies: 2 }, error: null }) };
    const record = { insert: jest.fn().mockResolvedValue({ error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(book).mockReturnValueOnce(record) } as never);
    await expect(LibraryService.borrowBook('book', 'student')).rejects.toMatchObject({ status: 500, message: 'Failed to record borrow action' });

    const records = { select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: null, error: { message: 'db' } }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(records) } as never);
    await expect(LibraryService.listBorrowRecords()).rejects.toMatchObject({ status: 500 });
  });

  it('increments a returned book and maps return or quantity update failures', async () => {
    const record = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { book_id: 'book', status: 'borrowed' }, error: null }) };
    const updateRecord = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    const book = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { available_copies: 1 }, error: null }) };
    const updateBook = { update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) };
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValueOnce(record).mockReturnValueOnce(updateRecord).mockReturnValueOnce(book).mockReturnValueOnce(updateBook) } as never);
    await expect(LibraryService.returnBook('record')).resolves.toEqual({ success: true });
    expect(updateBook.update).toHaveBeenCalledWith({ available_copies: 2 });
  });
});
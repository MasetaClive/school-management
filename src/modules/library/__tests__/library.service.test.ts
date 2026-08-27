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
});
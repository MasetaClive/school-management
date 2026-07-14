import { createClient } from '@/lib/supabase/server';

export class LibraryServiceError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

export class LibraryService {
    static async listBooks(query?: string) {
        const supabase = await createClient();
        let req = supabase.from('books').select('*').order('title');
        if (query) req = req.ilike('title', `%${query}%`);
        const { data, error } = await req;
        if (error) throw new LibraryServiceError('Failed to fetch books', 500);
        return (data || []).map(b => ({
            id: b.id,
            isbn: b.isbn,
            title: b.title,
            author: b.author,
            category: b.category,
            quantity: b.total_copies,
            available_quantity: b.available_copies,
            created_at: b.created_at,
            updated_at: b.updated_at
        }));
    }

    static async addBook(input: { title: string; author?: string; isbn?: string; category?: string; quantity: number }) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('books')
            .insert({
                title: input.title,
                author: input.author,
                isbn: input.isbn,
                category: input.category,
                total_copies: input.quantity,
                available_copies: input.quantity
            })
            .select('*')
            .single();

        if (error) throw new LibraryServiceError('Failed to add book', 500);
        return {
            id: data.id,
            isbn: data.isbn,
            title: data.title,
            author: data.author,
            category: data.category,
            quantity: data.total_copies,
            available_quantity: data.available_copies,
            created_at: data.created_at,
            updated_at: data.updated_at
        };
    }

    static async borrowBook(bookId: string, studentId: string) {
        const supabase = await createClient();

        // 1. Check availability using available_copies
        const { data: book, error: fetchError } = await supabase
            .from('books')
            .select('available_copies')
            .eq('id', bookId)
            .single();

        if (fetchError || !book) throw new LibraryServiceError('Book not found', 404);
        if (book.available_copies <= 0) throw new LibraryServiceError('Book currently unavailable', 400);

        // 2. Calculate due date (14 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        // 3. Create borrow record and decrement available_copies
        const { error: recordError } = await supabase
            .from('borrow_records')
            .insert({
                book_id: bookId,
                student_id: studentId,
                status: 'borrowed',
                due_date: dueDate.toISOString().split('T')[0] // YYYY-MM-DD
            });

        if (recordError) {
            console.error('Record borrow error:', recordError);
            throw new LibraryServiceError('Failed to record borrow action', 500);
        }

        const { error: updateError } = await supabase
            .from('books')
            .update({ available_copies: book.available_copies - 1 })
            .eq('id', bookId);

        if (updateError) throw new LibraryServiceError('Failed to update book quantity', 500);

        return { success: true };
    }

    static async returnBook(recordId: string) {
        const supabase = await createClient();

        // 1. Get borrow record
        const { data: record, error: fetchError } = await supabase
            .from('borrow_records')
            .select('book_id, status')
            .eq('id', recordId)
            .single();

        if (fetchError || !record) throw new LibraryServiceError('Borrow record not found', 404);
        if (record.status === 'returned') throw new LibraryServiceError('Book already returned', 400);

        // 2. Update record and increment available_copies
        const { error: recordError } = await supabase
            .from('borrow_records')
            .update({ status: 'returned', returned_at: new Date().toISOString() })
            .eq('id', recordId);

        if (recordError) throw new LibraryServiceError('Failed to update return status', 500);

        const { data: book } = await supabase.from('books').select('available_copies').eq('id', record.book_id).single();
        if (book) {
            await supabase.from('books').update({ available_copies: book.available_copies + 1 }).eq('id', record.book_id);
        }

        return { success: true };
    }

    static async listBorrowRecords() {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('borrow_records')
            .select(`
                *,
                book:books(title, author),
                student:students(full_name, student_id)
            `)
            .order('borrowed_at', { ascending: false });
        
        if (error) throw new LibraryServiceError('Failed to fetch records', 500);
        return data;
    }
}

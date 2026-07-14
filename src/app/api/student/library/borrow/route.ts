import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LibraryService, LibraryServiceError } from '@/modules/library/library.service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch the student profile linked to the logged-in user
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // 2. Parse the request body for book_id
    const body = await req.json().catch(() => ({}));
    const { book_id } = body;

    if (!book_id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
    }

    // 3. Borrow the book using LibraryService
    const result = await LibraryService.borrowBook(book_id, student.id);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof LibraryServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[student_borrow_api] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

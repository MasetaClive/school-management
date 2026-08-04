import { NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ReportCardService, ReportCardServiceError } from '@/modules/report-cards/reportCard.service';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const role = await getUserRole();

    if (!user || role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const examId = searchParams.get('exam_id');

    if (!studentId || !examId) {
      return NextResponse.json({ error: 'student_id and exam_id are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (parentError) throw parentError;
    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const { data: child, error: childError } = await supabase
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('parent_id', parent.id)
      .maybeSingle();

    if (childError) throw childError;
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const report = await ReportCardService.generateReport(studentId, examId);
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof ReportCardServiceError ? error.message : error instanceof Error ? error.message : 'Internal server error';
    const status = error instanceof ReportCardServiceError ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

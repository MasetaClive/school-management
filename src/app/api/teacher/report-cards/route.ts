import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { createClient } from '@/lib/supabase/server';
import { ReportCardService } from '@/modules/report-cards/reportCard.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const role = await getUserRole();

    if (!user || role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await TeacherService.getTeacherByUserId(user.id);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher record not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('student_id');
    const examId = searchParams.get('exam_id');

    if (!studentId || !examId) {
      return NextResponse.json({ error: 'student_id and exam_id are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: exam, error: examError } = await supabase.from('exams').select('teacher_id').eq('id', examId).maybeSingle();
    if (examError) throw examError;
    if (!exam || exam.teacher_id !== teacher.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await ReportCardService.generateReport(studentId, examId);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

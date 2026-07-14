import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/auth';
// import { tasks } from '@trigger.dev/sdk/v3';
import { z } from 'zod';

const markSchema = z.object({
  studentId: z.string().uuid(),
  date: z.string(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  remarks: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const role = await getUserRole();
  if (role !== 'admin' && role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = markSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { studentId, date, status, remarks } = parsed.data;

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, full_name, class_id, guardian_email, guardian_name, parents(email)')
    .eq('id', studentId)
    .single();

  if (studentError || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const parentEmail =
    (student.parents as { email?: string } | null)?.email ??
    (student as { guardian_email?: string }).guardian_email;

  const { error: attError } = await supabase.from('student_attendance').upsert(
    {
      student_id: studentId,
      attendance_date: date,
      status,
      remarks,
      class_id: student.class_id,
      recorded_by: null,
    },
    { onConflict: 'student_id,attendance_date' }
  );

  if (attError) {
    return NextResponse.json(
      { error: attError.message },
      { status: 500 }
    );
  }

  // TODO: Phase 4 - Trigger.dev notification integration
  /*
  if (status === 'absent' && parentEmail && process.env.TRIGGER_SECRET_KEY) {
      try {
        await tasks.trigger('attendance-absence-notification', {
          studentId,
          studentName: student.full_name,
          parentEmail,
          date,
          remarks,
        });
      } catch {
        // Log but don't fail the request
      }
    }
  */

  return NextResponse.json({ success: true });
}

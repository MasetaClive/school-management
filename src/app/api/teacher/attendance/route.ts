import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { TeacherService } from '@/modules/teachers/teacher.service';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const attendanceRecordSchema = z.object({
    student_id: z.string().uuid(),
    status: z.enum(['present', 'absent', 'late', 'excused']),
    remarks: z.string().optional().nullable(),
});

const submitAttendanceSchema = z.object({
    class_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (must be YYYY-MM-DD)'),
    records: z.array(attendanceRecordSchema),
});

// Helper to check if teacher is assigned to the class
async function verifyTeacherClass(supabase: any, teacherId: string, classId: string) {
    const [subjectCheck, classCheck] = await Promise.all([
        supabase
            .from('subject_assignments')
            .select('id')
            .eq('teacher_id', teacherId)
            .eq('class_id', classId)
            .limit(1),
        supabase
            .from('class_teachers')
            .select('id')
            .eq('teacher_id', teacherId)
            .eq('class_id', classId)
            .limit(1)
    ]);

    const isAssigned = (subjectCheck.data && subjectCheck.data.length > 0) || 
                       (classCheck.data && classCheck.data.length > 0);
    return isAssigned;
}

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
        const classId = searchParams.get('class_id');
        const date = searchParams.get('date');

        if (!classId || !date) {
            return NextResponse.json({ error: 'class_id and date are required' }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Verify permissions
        const isAssigned = await verifyTeacherClass(supabase, teacher.id, classId);
        if (!isAssigned) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Load all students in the class
        const { data: students, error: studentError } = await supabase
            .from('students')
            .select('id, full_name, student_id')
            .eq('class_id', classId)
            .order('full_name');

        if (studentError) throw studentError;

        // 3. Load existing attendance for this class and date
        const { data: attendance, error: attError } = await supabase
            .from('student_attendance')
            .select('student_id, status, remarks')
            .eq('class_id', classId)
            .eq('attendance_date', date);

        if (attError) throw attError;

        const attMap = new Map<string, { status: string; remarks?: string }>();
        attendance?.forEach(item => {
            attMap.set(item.student_id, { status: item.status, remarks: item.remarks });
        });

        // 4. Combine students with their attendance status
        const list = students?.map(student => {
            const att = attMap.get(student.id);
            return {
                id: student.id,
                full_name: student.full_name,
                student_id: student.student_id,
                status: att?.status || 'present',
                remarks: att?.remarks || '',
            };
        }) || [];

        return NextResponse.json({ data: list });
    } catch (e) {
        console.error('[teacher/attendance GET] error', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
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

        const body = await req.json();
        const parsed = submitAttendanceSchema.parse(body);

        const supabase = await createClient();

        // 1. Verify permissions
        const isAssigned = await verifyTeacherClass(supabase, teacher.id, parsed.class_id);
        if (!isAssigned) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Perform bulk upsert
        const rows = parsed.records.map(record => ({
            student_id: record.student_id,
            class_id: parsed.class_id,
            attendance_date: parsed.date,
            status: record.status,
            remarks: record.remarks || null,
            recorded_by: teacher.id,
        }));

        const { error } = await supabase
            .from('student_attendance')
            .upsert(rows, { onConflict: 'student_id,attendance_date' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('[teacher/attendance POST] error', e);
        if (e && typeof e === 'object' && 'name' in e && e.name === 'ZodError') {
            return NextResponse.json({ error: (e as any).message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

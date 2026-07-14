import { NextResponse } from 'next/server';
import { StudentService } from '@/modules/students/student.service';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardData = await StudentService.getStudentDashboardData(user.id);
    return NextResponse.json({
      ...dashboardData,
      user_metadata: user.user_metadata
    });
  } catch (error: any) {
    console.error('[student_dashboard_api] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.status || 500 }
    );
  }
}

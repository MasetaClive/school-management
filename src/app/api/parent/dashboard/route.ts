import { NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { ParentService, ParentServiceError } from '@/modules/parents/parent.service';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const role = await getUserRole();
    if (!user || role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await ParentService.getDashboardData(user.id));
  } catch (error) {
    const status = error instanceof ParentServiceError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status });
  }
}

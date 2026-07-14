import { NextResponse } from 'next/server';
import { StatsService } from '@/modules/stats/stats.service';
import { getCurrentUser, getUserRole } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const role = await getUserRole();
        if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const stats = await StatsService.getDashboardStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error('[stats_api] error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

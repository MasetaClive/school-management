import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { email_notifications, sms_notifications } = body;

    // Save notification preferences in the user's secure auth metadata
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: {
        email_notifications: !!email_notifications,
        sms_notifications: !!sms_notifications
      }
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated',
      user_metadata: data.user.user_metadata
    });
  } catch (error: any) {
    console.error('[student_notifications_api] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

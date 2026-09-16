import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('student_auth_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const session = await db.getSession(token);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }

    const history = await db.getUserSessions(session.user.id);

    // Map history to safe values
    const safeHistory = history.map((s: any) => ({
      id: s.id,
      login_at: s.login_at,
      logout_at: s.logout_at,
      status: s.status,
      device_info: s.device_info,
      ip_address: s.ip_address,
    }));

    return NextResponse.json({ success: true, history: safeHistory });
  } catch (err: any) {
    console.error('Session history error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

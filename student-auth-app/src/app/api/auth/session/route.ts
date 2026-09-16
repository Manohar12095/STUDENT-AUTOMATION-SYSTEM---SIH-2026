import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sas_token')?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = await db.getSession(token);
    if (!session || !session.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone,
        dob: session.user.dob,
        age: session.user.age,
        gender: session.user.gender,
        languages: session.user.languages,
        institution: session.user.institution,
        department: session.user.department,
        roll_number: session.user.roll_number,
        email_verified: session.user.email_verified,
        account_status: session.user.account_status,
      },
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error('Session error:', err);
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}

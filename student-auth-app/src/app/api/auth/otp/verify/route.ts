import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, otp, purpose } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP code are required.' }, { status: 400 });
    }

    const p = purpose || 'registration';
    const result = await db.verifyOTP(email, otp, p);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    const user = await db.findUserByEmail(email);

    if (p === 'registration' && user) {
      await db.updateUser(user.id, { email_verified: true, account_status: 'active' });
    }

    // Create session and set cookie
    let session = null;
    if (user) {
      session = await db.createSession(user.id);
      const cookieStore = await cookies();
      cookieStore.set('sas_token', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 8 * 60 * 60, // 8 hours
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification successful!',
      userId: user?.id,
      token: session?.token,
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        institution: user.institution,
        department: user.department,
        roll_number: user.roll_number,
      } : null,
    });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendOTP } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email, purpose } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const validPurposes = ['registration', 'login', 'reset'];
    const p = validPurposes.includes(purpose) ? purpose : 'registration';

    // Verify user exists if purpose is login or reset
    const user = await db.findUserByEmail(email);
    if ((p === 'login' || p === 'reset') && !user) {
      // Generic message to prevent email enumeration
      return NextResponse.json({ success: true, message: 'If this email is registered, a code has been dispatched.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.saveOTP(email, otp, p, user?.id);

    try {
      await sendOTP(email, otp, p as any);
      console.log(`[OTP] Resent OTP to ${email} for purpose: ${p}`);
    } catch (mailErr) {
      console.error('[OTP] Failed to send email:', mailErr);
      return NextResponse.json({ error: 'Failed to deliver email. Please check your address.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email.',
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

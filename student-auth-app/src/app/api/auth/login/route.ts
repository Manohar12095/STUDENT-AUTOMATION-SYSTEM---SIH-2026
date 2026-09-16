import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { sendOTP } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Check if face enrollment exists
    const faceCreds = await db.getFaceCredentials(user.id);
    const hasEnrolledFace = !!faceCreds;

    // If no face enrolled, skip face step and send OTP directly
    if (!hasEnrolledFace) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await db.saveOTP(user.email, otp, 'login', user.id);
      try {
        await sendOTP(user.email, otp, 'login');
      } catch (mailErr) {
        console.error('[LOGIN] Failed to send OTP:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      requiresFace: true,
      hasEnrolledFace,
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

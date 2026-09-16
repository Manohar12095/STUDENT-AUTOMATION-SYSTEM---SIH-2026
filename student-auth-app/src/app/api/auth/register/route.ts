import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { sendOTP } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      dob,
      age,
      gender,
      languages,
      institution,
      department,
      roll_number,
      biometricConsent,
    } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    if (!biometricConsent) {
      return NextResponse.json({ error: 'Biometric consent is mandatory before account registration.' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await db.findUserByEmail(email);
    if (existing && existing.email_verified) {
      return NextResponse.json({ error: 'An account with this email address already exists. Please log in.' }, { status: 409 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create or update pending user
    const user = await db.createUser({
      name,
      email,
      password_hash,
      phone,
      dob,
      age: Number(age) || null,
      gender,
      languages,
      institution,
      department,
      roll_number,
      email_verified: false,
    });

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.saveOTP(email, otp, 'registration', user.id);

    // Send real email OTP via Gmail Nodemailer
    try {
      await sendOTP(email, otp, 'registration');
      console.log(`[AUTH] Sent real OTP to ${email}`);
    } catch (mailErr) {
      console.error('[AUTH] Mail sending error:', mailErr);
      return NextResponse.json({
        error: 'Failed to send verification email. Please verify your email address or check server SMTP settings.',
        details: String(mailErr)
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Account created. Verification code sent to your email.',
      userId: user.id,
      email: user.email,
    });
  } catch (err: any) {
    console.error('Registration route error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

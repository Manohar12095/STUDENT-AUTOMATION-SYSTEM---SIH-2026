import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendOTP } from '@/lib/email';

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const FACE_MATCH_THRESHOLD = 0.52; // Threshold for cosine similarity

export async function POST(req: Request) {
  try {
    const { userId, liveEmbedding } = await req.json();

    if (!userId || !liveEmbedding || !Array.isArray(liveEmbedding)) {
      return NextResponse.json({ error: 'User ID and live face embedding are required.' }, { status: 400 });
    }

    const user = await db.findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const faceCreds = await db.getFaceCredentials(userId);
    if (!faceCreds || !faceCreds.embeddings) {
      return NextResponse.json({ error: 'No enrolled face credentials found for this account.' }, { status: 404 });
    }

    const angles = ['front', 'bottom', 'left', 'right'] as const;
    let bestScore = 0;
    let bestAngle: string | null = null;

    angles.forEach((angle) => {
      const stored = faceCreds.embeddings[angle];
      if (Array.isArray(stored) && stored.length > 0) {
        const score = cosineSimilarity(liveEmbedding, stored);
        if (score > bestScore) {
          bestScore = score;
          bestAngle = angle;
        }
      }
    });

    const isMatch = bestScore >= FACE_MATCH_THRESHOLD;
    const matchPercentage = Math.round(bestScore * 100);

    if (!isMatch) {
      return NextResponse.json({
        success: false,
        match: false,
        score: bestScore,
        matchPercentage,
        message: `Face verification failed (${matchPercentage}% match). Please ensure good lighting and face the camera directly.`,
      }, { status: 401 });
    }

    // Biometric verified! Generate 6-digit OTP for 2FA step
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.saveOTP(user.email, otp, 'login', user.id);

    try {
      await sendOTP(user.email, otp, 'login');
      console.log(`[FACE_VERIFY] Biometric matched (${matchPercentage}% via ${bestAngle}). Dispatched 2FA OTP to ${user.email}`);
    } catch (mailErr) {
      console.error('[FACE_VERIFY] Failed to email OTP:', mailErr);
    }

    return NextResponse.json({
      success: true,
      match: true,
      score: bestScore,
      bestAngle,
      matchPercentage,
      message: `Face identity verified (${matchPercentage}% match)! A security OTP has been sent to your email.`,
      email: user.email,
    });
  } catch (err: any) {
    console.error('Face verification route error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

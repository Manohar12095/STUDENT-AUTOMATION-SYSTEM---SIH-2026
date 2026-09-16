import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId, embeddings, images } = await req.json();

    if (!userId || !embeddings || !images) {
      return NextResponse.json({ error: 'User ID, face embeddings, and 4 angle images are required.' }, { status: 400 });
    }

    const { front: embFront, bottom: embBottom, left: embLeft, right: embRight } = embeddings;
    const { front: imgFront, bottom: imgBottom, left: imgLeft, right: imgRight } = images;

    if (!embFront || !embBottom || !embLeft || !embRight) {
      return NextResponse.json({ error: 'All 4 face angle embeddings (Front, Bottom, Left, Right) are mandatory.' }, { status: 400 });
    }

    if (!imgFront || !imgBottom || !imgLeft || !imgRight) {
      return NextResponse.json({ error: 'All 4 face angle images (Front, Bottom, Left, Right) are mandatory for the ML database.' }, { status: 400 });
    }

    // Attempt to upload images to Supabase storage bucket 'face_images' if configured
    let storedUrls = { front: imgFront, bottom: imgBottom, left: imgLeft, right: imgRight };
    try {
      const angles = ['front', 'bottom', 'left', 'right'] as const;
      for (const angle of angles) {
        const base64Data = (images as any)[angle];
        if (base64Data && base64Data.startsWith('data:image')) {
          const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
          const filePath = `${userId}/${angle}_${Date.now()}.jpg`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('face_images')
            .upload(filePath, buffer, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr && uploadData) {
            const { data: publicUrl } = supabase.storage.from('face_images').getPublicUrl(filePath);
            storedUrls[angle] = publicUrl.publicUrl;
          }
        }
      }
    } catch (storageErr) {
      console.warn('[FACE_ENROLL] Supabase storage upload note (using base64 inline):', storageErr);
    }

    // Save to Database (Encrypted embeddings + ML angle images)
    const record = await db.storeFaceCredentials(userId, {
      embeddings: {
        front: embFront,
        bottom: embBottom,
        left: embLeft,
        right: embRight,
      },
      images: storedUrls,
    });

    console.log(`[FACE_ENROLL] Successfully stored 4-angle biometric embeddings and ML training images for user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: '4-angle face images stored in ML database and biometric embeddings encrypted successfully.',
      credentialId: record.id,
    });
  } catch (err: any) {
    console.error('Face enroll route error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save biometric enrollment.' }, { status: 500 });
  }
}

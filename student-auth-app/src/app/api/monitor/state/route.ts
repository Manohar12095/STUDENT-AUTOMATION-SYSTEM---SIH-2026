import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { state } = await req.json();
    const token = cookies().get('sas_token')?.value;

    if (!state) {
      return NextResponse.json({ error: 'State is required.' }, { status: 400 });
    }

    let userId = 'anonymous';
    let sessionId = undefined;

    if (token) {
      const session = await db.getSession(token);
      if (session && session.user) {
        userId = session.user.id;
        sessionId = session.id;
      }
    }

    const log = await db.logMonitorState(userId, state, sessionId);
    return NextResponse.json({ success: true, log });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

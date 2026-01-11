import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = (searchParams.get('userId') || 'anon').trim() || 'anon';
  const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

  const snap = await db
    .collection('mistakes')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  const items = snap.docs.map((d) => d.data());
  return NextResponse.json({ data: items });
}

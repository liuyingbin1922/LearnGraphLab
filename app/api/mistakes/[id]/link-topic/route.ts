import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const topicSlug = String(body?.topicSlug || '').trim();

    if (!topicSlug) {
      return NextResponse.json({ error: 'Missing topicSlug' }, { status: 400 });
    }

    const topicRef = db.collection('topics').doc(topicSlug);
    const topicSnap = await topicRef.get();
    if (!topicSnap.exists) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const topic = topicSnap.data() as any;
    const mistakeRef = db.collection('mistakes').doc(params.id);
    const mistakeSnap = await mistakeRef.get();
    if (!mistakeSnap.exists) {
      return NextResponse.json({ error: 'Mistake not found' }, { status: 404 });
    }

    await mistakeRef.set(
      {
        topicSlug,
        topicId: topicSlug,
        topicTitle: topic.title || topicSlug,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    const updated = await mistakeRef.get();
    return NextResponse.json({ data: updated.data() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Unknown error', detail: String(err) },
      { status: 500 }
    );
  }
}

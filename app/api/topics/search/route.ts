import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 简易搜索：
 * - q 为空：返回最新 20
 * - q 有值：按 title 前缀范围查询（中英文都能用，但中文分词不完美）
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

  let snap;

  if (!q) {
    snap = await db.collection('topics').orderBy('updatedAt', 'desc').limit(limit).get();
  } else {
    snap = await db
      .collection('topics')
      .orderBy('title')
      .startAt(q)
      .endAt(q + '\uf8ff')
      .limit(limit)
      .get();

    if (snap.empty) {
      snap = await db.collection('topics').orderBy('updatedAt', 'desc').limit(limit).get();
    }
  }

  const items = snap.docs.map((d) => d.data());
  return NextResponse.json({
    data: items.map((t: any) => ({
      slug: t.slug || t.id,
      title: t.title || t.slug || t.id,
      subject: t.subject,
    })),
  });
}

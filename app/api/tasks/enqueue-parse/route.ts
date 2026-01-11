import { NextResponse } from 'next/server';
import { enqueueParseJob } from '@/lib/tasks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST body:
 * {
 *   "userId": "anon",
 *   "items": [
 *     {"gsUri":"gs://bucket/path.png","mimeType":"image/png","hint":"optional"}
 *   ]
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = String(body?.userId || 'anon').trim() || 'anon';
    const items = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: 'Missing items' }, { status: 400 });
    }

    const results = [];
    for (const it of items) {
      const gsUri = String(it?.gsUri || '').trim();
      const mimeType = String(it?.mimeType || 'image/png').trim();
      const hint = String(it?.hint || '').trim();

      if (!gsUri.startsWith('gs://')) continue;

      const r = await enqueueParseJob({ userId, gsUri, mimeType, hint });
      results.push({ gsUri, ...r });
    }

    return NextResponse.json({ data: results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Unknown error', detail: String(err) },
      { status: 500 }
    );
  }
}

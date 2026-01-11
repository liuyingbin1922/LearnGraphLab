import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { ai, model, generationConfig } from '@/lib/genai';
import { uploadImageToGCS } from '@/lib/gcs';
import { db } from '@/lib/firebaseAdmin';
import { TopicSchema } from '@/lib/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildPrompt(userHint?: string) {
  return `
你是一个“题目/教材截图 → 知识点结构化”的解析器。
请严格输出 JSON，禁止输出 markdown、禁止输出多余文字。

输出 JSON schema（必须完全匹配）：
{
  "language": "zh|en|mixed",
  "subject": "string",
  "gradeLevel": "string (optional)",
  "title": "string",
  "slug": "string (用英文小写+短横线，适合SEO)",
  "summary": "string (一句话总结)",
  "keyPoints": ["string", "... (3~8条)"],
  "commonMistakes": ["string", "... (1~6条)"],
  "prerequisites": ["string", "... (<=10)"],
  "relatedTopics": ["string", "... (<=12)"],
  "workedExamples": [
    {"question":"string","shortSolution":"string"}
  ],
  "tags": ["string", "... (<=20)"],
  "extractedQuestionText": "string (optional, 尽可能还原题干)",
  "confidence": 0.0~1.0
}

约束：
- title 优先中文（英文题也可以中英混合）
- slug 必须是英文小写+短横线（例如: "quadratic-discriminant"）
- 如果图片信息不完整，也要尽力输出，并降低 confidence
- workedExamples：优先基于图片题目；若无法，则给“最小例题”
- subject 示例：Math / English / Physics / Chemistry / CS / etc

${userHint ? `用户补充信息：${userHint}` : ''}

只输出 JSON（从 "{" 开始到 "}" 结束）。
`.trim();
}

function extractJson(raw: string) {
  const t = raw.trim();
  try {
    return JSON.parse(t);
  } catch {
    const s = t.indexOf('{');
    const e = t.lastIndexOf('}');
    if (s >= 0 && e > s) return JSON.parse(t.slice(s, e + 1));
    throw new Error('Model did not return valid JSON');
  }
}

async function upsertTopicTransaction(topic: any) {
  const ref = db.collection('topics').doc(topic.slug);
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      tx.set(ref, {
        ...topic,
        id: topic.slug,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      tx.set(
        ref,
        {
          ...topic,
          id: topic.slug,
          updatedAt: now,
        },
        { merge: true }
      );
    }
  });

  return { id: topic.slug };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('image') as File | null;
    const hint = (form.get('hint') as string | null) ?? '';
    const userId = ((form.get('userId') as string | null) ?? 'anon').trim() || 'anon';

    if (!file) {
      return NextResponse.json({ error: 'Missing image file field: image' }, { status: 400 });
    }

    const uploaded = await uploadImageToGCS(file, userId);

    const imagePart = {
      fileData: {
        mimeType: uploaded.mimeType,
        fileUri: uploaded.gsUri,
      },
    };

    const textPart = { text: buildPrompt(hint) };

    const requestPayload = {
      model,
      contents: [{ role: 'user', parts: [imagePart, textPart] }],
      config: generationConfig,
    };

    const resp = await ai.models.generateContent(requestPayload as any);

    const rawText =
      (resp as any).text ??
      (resp as any).candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ??
      '';

    const parsed = extractJson(rawText);
    const topic = TopicSchema.parse(parsed);

    await upsertTopicTransaction(topic);

    const now = Date.now();
    const mistakeId = nanoid(12);
    const mistakeRef = db.collection('mistakes').doc(mistakeId);

    const mistake = {
      id: mistakeId,
      userId,
      createdAt: now,
      updatedAt: now,
      image: uploaded,
      extractedQuestionText: topic.extractedQuestionText ?? '',
      topicSlug: topic.slug,
      topicId: topic.slug,
      topicTitle: topic.title,
      parse: topic,
    };

    await mistakeRef.set(mistake);

    return NextResponse.json({
      data: {
        mistakeId,
        topicSlug: topic.slug,
        topicTitle: topic.title,
        image: uploaded,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Unknown error', detail: String(err) },
      { status: 500 }
    );
  }
}

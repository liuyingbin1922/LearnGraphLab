import { siteUrl } from '@/lib/urls';
import RelinkTopic from './RelinkTopic';

export const dynamic = 'force-dynamic';

async function getMistake(id: string) {
  const res = await fetch(siteUrl(`/api/mistakes/${id}`), { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as any;
}

export default async function MistakeDetailPage({ params }: { params: { id: string } }) {
  const data = await getMistake(params.id);
  if (!data) return <div style={{ padding: 24 }}>Not found</div>;

  const topicSlug = data.topicSlug as string | undefined;

  return (
    <main style={{ maxWidth: 960, margin: '40px auto', padding: 16, fontFamily: 'system-ui' }}>
      <a href="/mistakes" style={{ textDecoration: 'underline' }}>
        ← 返回错题本
      </a>

      <h1 style={{ fontSize: 26, fontWeight: 950, marginTop: 12 }}>
        {data.topicTitle || topicSlug || '错题详情'}
      </h1>

      {data.image?.httpUrl ? (
        <div style={{ marginTop: 14 }}>
          <img
            src={data.image.httpUrl}
            alt="uploaded"
            style={{ maxWidth: '100%', borderRadius: 16, border: '1px solid #eee' }}
          />
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>{data.image.gsUri}</div>
        </div>
      ) : (
        <div style={{ marginTop: 12, opacity: 0.75 }}>
          该记录没有 httpUrl（可能是 worker 生成的），gsUri：{data.image?.gsUri}
        </div>
      )}

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, fontWeight: 900 }}>题干（抽取）</h2>
        <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {data.extractedQuestionText || '（无）'}
        </div>
      </section>

      {topicSlug && (
        <section style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900 }}>关联知识点</h2>
          <a href={`/topics/${topicSlug}`} style={{ textDecoration: 'underline' }}>
            打开知识点页：/topics/{topicSlug}
          </a>
        </section>
      )}

      <RelinkTopic mistakeId={params.id} currentSlug={topicSlug} />

      {data.parse && (
        <section style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 900 }}>解析结果（JSON）</h2>
          <pre
            style={{
              marginTop: 10,
              padding: 12,
              background: '#fafafa',
              border: '1px solid #eee',
              borderRadius: 12,
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(data.parse, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}

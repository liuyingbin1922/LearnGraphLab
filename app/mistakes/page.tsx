import { siteUrl } from '@/lib/urls';

export const dynamic = 'force-dynamic';

async function getMistakes() {
  const res = await fetch(siteUrl('/api/mistakes?userId=anon&limit=30'), { cache: 'no-store' });
  const json = await res.json();
  return (json.data || []) as any[];
}

export default async function MistakesPage() {
  const items = await getMistakes();

  return (
    <main style={{ maxWidth: 960, margin: '40px auto', padding: 16, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>错题本</h1>
        <a href="/" style={{ textDecoration: 'underline' }}>
          + 新增错题
        </a>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        {items.map((m) => (
          <a
            key={m.id}
            href={`/mistakes/${m.id}`}
            style={{
              border: '1px solid #eee',
              borderRadius: 14,
              padding: 14,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ fontWeight: 900 }}>{m.topicTitle || m.topicSlug || '未命名知识点'}</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              {(m.extractedQuestionText || '').slice(0, 140)}
              {(m.extractedQuestionText || '').length > 140 ? '…' : ''}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
              {new Date(m.createdAt).toLocaleString()}
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}

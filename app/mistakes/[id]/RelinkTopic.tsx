'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type TopicHit = { slug: string; title: string; subject?: string };

export default function RelinkTopic({
  mistakeId,
  currentSlug,
}: {
  mistakeId: string;
  currentSlug?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<TopicHit[]>([]);
  const [selected, setSelected] = useState<string>(currentSlug || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canUpdate = useMemo(() => selected && selected !== currentSlug, [selected, currentSlug]);

  useEffect(() => {
    let canceled = false;

    async function run() {
      setMsg(null);
      const qs = new URLSearchParams();
      if (q.trim()) qs.set('q', q.trim());
      qs.set('limit', '20');

      const res = await fetch(`/api/topics/search?${qs.toString()}`);
      const json = await res.json();
      if (!canceled) setHits(json.data || []);
    }

    const t = setTimeout(run, 250);
    return () => {
      canceled = true;
      clearTimeout(t);
    };
  }, [q]);

  async function onUpdate() {
    if (!canUpdate) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/mistakes/${mistakeId}/link-topic`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topicSlug: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Update failed');

      setMsg('已更新关联知识点 ✅');
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 18 }}>
      <h2 style={{ fontSize: 16, fontWeight: 900 }}>手动更正关联知识点</h2>
      <div style={{ opacity: 0.75, marginTop: 6, lineHeight: 1.5 }}>
        模型可能 slug 不准；你可以搜索并选择正确的 Topic。
      </div>

      <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索知识点（输入标题关键字）"
          style={{ padding: 10, borderRadius: 12, border: '1px solid #ddd' }}
        />

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ padding: 10, borderRadius: 12, border: '1px solid #ddd' }}
        >
          <option value="">— 请选择 —</option>
          {hits.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.title} {t.subject ? `(${t.subject})` : ''} — {t.slug}
            </option>
          ))}
        </select>

        <button
          disabled={loading || !canUpdate}
          onClick={onUpdate}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid #ddd',
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          {loading ? '更新中...' : '更新关联'}
        </button>

        {msg && <div style={{ fontSize: 13, opacity: 0.85 }}>{msg}</div>}
      </div>
    </section>
  );
}

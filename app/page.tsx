'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!file) return setErr('请选择图片');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('hint', hint);
      fd.append('userId', 'anon');

      const res = await fetch('/api/mistakes/create', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Create failed');

      router.push(`/mistakes/${json.data.mistakeId}`);
    } catch (e: any) {
      setErr(e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 860, margin: '40px auto', padding: 16, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 26, fontWeight: 900 }}>错题 → 知识点解析（GCS + Firestore + GenAI）</h1>
      <p style={{ opacity: 0.8 }}>
        上传题目截图：上传到 GCS → 使用 gs:// 调用 GenAI → Topic ISR 页面 & 错题本。
      </p>

      <form onSubmit={onSubmit} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <textarea
          rows={4}
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="可选：补充信息（学科/年级/你希望偏向的知识点/语言等）"
          style={{ padding: 10 }}
        />
        <button
          disabled={loading}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid #ddd',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {loading ? '处理中...' : '上传并解析'}
        </button>
      </form>

      {err && <div style={{ marginTop: 12, color: 'crimson' }}>{err}</div>}

      <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
        <a href="/mistakes" style={{ textDecoration: 'underline' }}>
          去错题本
        </a>
      </div>
    </main>
  );
}

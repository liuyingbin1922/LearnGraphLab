import { siteUrl } from '@/lib/urls';
import { buildTopicSeo } from '@/lib/seo';
import type { Metadata } from 'next';

export const revalidate = 3600;
export const dynamicParams = true;

async function getTopic(slug: string) {
  const res = await fetch(siteUrl(`/api/topics/${slug}`), {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as any;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const topic = await getTopic(params.slug);

  if (!topic) {
    return {
      title: 'Topic Not Found',
      description: 'Topic not found',
      robots: { index: false, follow: false },
    };
  }

  const seo = buildTopicSeo(topic, params.slug);
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `/topics/${params.slug}`,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `/topics/${params.slug}`,
      type: 'article',
    },
  };
}

export default async function TopicPage({ params }: { params: { slug: string } }) {
  const topic = await getTopic(params.slug);
  if (!topic) return <div style={{ padding: 24 }}>Topic not found</div>;

  const seo = buildTopicSeo(topic, params.slug);

  return (
    <main style={{ maxWidth: 960, margin: '40px auto', padding: 16, fontFamily: 'system-ui' }}>
      {seo.jsonLd.map((obj, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}

      <a href="/mistakes" style={{ textDecoration: 'underline' }}>
        ← 去错题本
      </a>

      <h1 style={{ fontSize: 32, fontWeight: 950, marginTop: 12 }}>{topic.title}</h1>
      <div style={{ opacity: 0.7, marginTop: 6 }}>
        {topic.subject} {topic.gradeLevel ? `· ${topic.gradeLevel}` : ''} · slug: {topic.slug}
      </div>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900 }}>一句话总结</h2>
        <p style={{ lineHeight: 1.7 }}>{topic.summary}</p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900 }}>关键要点</h2>
        <ul>
          {(topic.keyPoints || []).map((x: string, i: number) => (
            <li key={i} style={{ marginTop: 6, lineHeight: 1.7 }}>
              {x}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900 }}>常见错误</h2>
        <ul>
          {(topic.commonMistakes || []).map((x: string, i: number) => (
            <li key={i} style={{ marginTop: 6, lineHeight: 1.7 }}>
              {x}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900 }}>例题</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {(topic.workedExamples || []).map((ex: any, i: number) => (
            <div key={i} style={{ border: '1px solid #eee', borderRadius: 14, padding: 12 }}>
              <div style={{ fontWeight: 900 }}>例题 {i + 1}</div>
              <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{ex.question}</div>
              <div style={{ marginTop: 8, opacity: 0.95, whiteSpace: 'pre-wrap' }}>
                <b>简解：</b> {ex.shortSolution}
              </div>
            </div>
          ))}
        </div>
      </section>

      {topic.tags?.length ? (
        <section style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900 }}>标签</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {topic.tags.map((t: string) => (
              <span
                key={t}
                style={{
                  border: '1px solid #eee',
                  borderRadius: 999,
                  padding: '6px 10px',
                  fontSize: 12,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

export function buildTopicSeo(topic: any, slug: string) {
  const title = `${topic.title}｜${topic.subject} 知识点讲解`;
  const description =
    (topic.summary && String(topic.summary).slice(0, 160)) ||
    `${topic.title} 的核心要点、常见错误、例题与简解。`;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    about: topic.title,
    inLanguage: topic.language || 'zh',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Topics', item: '/topics' },
      { '@type': 'ListItem', position: 3, name: topic.title, item: `/topics/${slug}` },
    ],
  };

  const faqItems: any[] = [];
  const cm = topic.commonMistakes?.filter(Boolean) || [];
  const kp = topic.keyPoints?.filter(Boolean) || [];

  if (cm[0]) {
    faqItems.push({
      '@type': 'Question',
      name: `做 ${topic.title} 最常见的错误是什么？`,
      acceptedAnswer: { '@type': 'Answer', text: String(cm[0]) },
    });
  }
  kp.slice(0, 4).forEach((k: string, i: number) => {
    faqItems.push({
      '@type': 'Question',
      name: `${topic.title} 的关键点 ${i + 1} 是什么？`,
      acceptedAnswer: { '@type': 'Answer', text: String(k) },
    });
  });

  const faqLd =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems,
        }
      : null;

  return {
    title,
    description,
    jsonLd: [articleLd, breadcrumbLd, ...(faqLd ? [faqLd] : [])],
  };
}

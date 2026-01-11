export function siteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) throw new Error('Missing env NEXT_PUBLIC_SITE_URL');
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

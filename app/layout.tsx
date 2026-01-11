import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LearnGraphLab',
  description: 'LearnGraphLab - Mistake parsing and topic knowledge pages',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '放置me — Houchi me',
  description:
    'あなたのクローンが、知らない自分を見つけてくる。放置しておくほど、あなたが広がる。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

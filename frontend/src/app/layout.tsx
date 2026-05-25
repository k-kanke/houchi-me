import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  variable: '--font-sans-jp',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '700'],
});

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
    <html
      lang="ja"
      className={`${inter.variable} ${jetbrains.variable} ${notoSansJP.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

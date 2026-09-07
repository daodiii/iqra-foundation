import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { site } from '@/content/site.no';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: site.meta.title,
  description: site.meta.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preload" as="image" href="/media/iqra-poster.jpg" />
      </head>
      <body>{children}</body>
    </html>
  );
}

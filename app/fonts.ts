import localFont from 'next/font/local';

/**
 * The brand's two typefaces, self-hosted.
 *
 * The guide names General Sans as the primary face and Supreme as the secondary, both from
 * Fontshare under the ITF Free Font License, which allows self-hosting; the files are in
 * `brand/fonts/` beside the licence they came with. Only the weights the site sets are
 * shipped — a weight nobody uses is bytes on every first visit. Adding one is a line here
 * and a file there.
 *
 * `next/font/local` inlines the @font-face rules and preloads the files, and `display:
 * swap` shows the fallback until they arrive; the metrics-matched fallbacks it generates
 * are what keep the page from shifting when they do.
 */
export const generalSans = localFont({
  variable: '--font-general-sans',
  display: 'swap',
  src: [
    { path: '../brand/fonts/general-sans/GeneralSans-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../brand/fonts/general-sans/GeneralSans-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../brand/fonts/general-sans/GeneralSans-Semibold.woff2', weight: '600', style: 'normal' },
    { path: '../brand/fonts/general-sans/GeneralSans-Bold.woff2', weight: '700', style: 'normal' },
  ],
});

export const supreme = localFont({
  variable: '--font-supreme',
  display: 'swap',
  src: [
    { path: '../brand/fonts/supreme/Supreme-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../brand/fonts/supreme/Supreme-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../brand/fonts/supreme/Supreme-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../brand/fonts/supreme/Supreme-Extrabold.woff2', weight: '800', style: 'normal' },
  ],
});

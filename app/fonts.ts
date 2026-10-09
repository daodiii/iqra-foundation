import localFont from 'next/font/local';

/**
 * The brand's two typefaces, self-hosted.
 *
 * The guide names General Sans as the primary face and Supreme as the secondary, both from
 * Fontshare under the ITF Free Font License, which allows self-hosting; the files are in
 * `brand/fonts/` beside the licence they came with.
 *
 * The elite study sets the whole home page in two weights of each (the type scale in
 * globals.css): General Sans 500 and 600 for display and interface, Supreme 400 and 500 for
 * running text. Four files where there were eight, and only General Sans is preloaded: the first
 * screen (the menu, the hero's paragraph and its two buttons) is set in it alone, so Supreme comes
 * after the poster instead of racing it. Supreme has the metrics-matched fallback `next/font`
 * generates, so its late arrival does not move the page.
 */
export const generalSans = localFont({
  variable: '--font-general-sans',
  display: 'swap',
  src: [
    { path: '../brand/fonts/general-sans/GeneralSans-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../brand/fonts/general-sans/GeneralSans-Semibold.woff2', weight: '600', style: 'normal' },
  ],
});

export const supreme = localFont({
  variable: '--font-supreme',
  display: 'swap',
  preload: false,
  src: [
    { path: '../brand/fonts/supreme/Supreme-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../brand/fonts/supreme/Supreme-Medium.woff2', weight: '500', style: 'normal' },
  ],
});

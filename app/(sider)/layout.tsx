import { instrumentSans } from '@/app/fonts';
import { Analytics } from '@/components/site/Analytics';
import { Smooth } from '@/components/site/Smooth';
import { Fot } from '@/components/forside/Fot';
import { Merke } from '@/components/forside/Merke';
import { Topp } from '@/components/forside/Topp';
import styles from '@/components/forside/forside.module.css';

/**
 * The redesigned subpages' shell (2026-11-20): the front page's own — «Kameleon», the menu layer,
 * the navy foot, Instrument Sans — but with no hero to fly the logo in, so the logo stands in the
 * header from the first frame (`data-solid`) and the header follows the ground under it at once.
 * The article, the archive and the legal pages keep the site's old shell (`app/(site)/layout.tsx`).
 */
export default function SiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="topp" className={`${instrumentSans.variable} ${styles.page}`} data-forside data-solid="">
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.dataset.js=''" }} />
      <Merke />
      <Smooth />
      <Analytics />
      <Topp mark />
      <main id="innhold" className={styles.main}>
        {children}
      </main>
      <Fot />
    </div>
  );
}

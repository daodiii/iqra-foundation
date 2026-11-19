import { instrumentSans } from '@/app/fonts';
import { Analytics } from '@/components/site/Analytics';
import { Smooth } from '@/components/site/Smooth';
import { Fot } from '@/components/forside/Fot';
import { Merke } from '@/components/forside/Merke';
import { Topp } from '@/components/forside/Topp';
import styles from '@/components/forside/forside.module.css';

/**
 * The front page's own shell, since the redesign (2026-11-19): its header «Kameleon» with the menu
 * layer, its navy foot, and Instrument Sans in place of the brand's two faces. The other pages keep
 * the site's shell (`app/(site)/layout.tsx`) until the owner takes the redesign further.
 *
 * The first script marks the page as running JavaScript before it paints, so what waits to be
 * revealed is hidden from the first frame; without JavaScript everything stands as laid out.
 */
export default function ForsideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="topp" className={`${instrumentSans.variable} ${styles.page}`} data-forside>
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.dataset.js=''" }} />
      <Merke />
      <Smooth />
      <Analytics />
      <Topp />
      <main id="innhold" className={styles.main}>
        {children}
      </main>
      <Fot />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { LoggInn } from '@/components/redaksjon/LoggInn';
import styles from '@/components/redaksjon/redaksjon.module.css';
import { testEditor } from '@/lib/redaksjon/access';

/**
 * Logging in: the address, then a code sent to it from the site's own mailbox (2026-11-25, in place
 * of Clerk). With the test editor there is nothing to log in to.
 */
export default function LoggInnPage() {
  if (testEditor()) redirect('/redaksjon');
  return (
    <main className={styles.door}>
      <div className={styles.doorSheet}>
        <div className={styles.doorBrand}>
          <img src="/brand/iqra-mark.svg" alt="Iqra Foundation" />
          <span>Redaksjon</span>
        </div>
        <LoggInn />
      </div>
    </main>
  );
}

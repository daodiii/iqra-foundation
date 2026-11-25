import { redirect } from 'next/navigation';
import styles from '@/components/redaksjon/redaksjon.module.css';
import { LoggUt } from '@/components/redaksjon/LoggUt';
import { Shell } from '@/components/redaksjon/Shell';
import { counts } from '@/lib/redaksjon/load';
import { testEditor } from '@/lib/redaksjon/access';
import { currentEditor } from '@/lib/redaksjon/session';

/**
 * Everything behind the login. The proxy has already checked the session cookie; this asks again, and checks the
 * address against the foundation's list, so a page is never served on the proxy's word alone.
 */
export default async function Innlogget({ children }: { children: React.ReactNode }) {
  const who = await currentEditor();
  if (who.kind === 'anon') redirect('/redaksjon/logg-inn');
  if (who.kind === 'denied') {
    return (
      <main className={styles.door}>
        <div className={styles.doorSheet}>
          <div className={styles.doorCard}>
            <h1>Du har ikke tilgang</h1>
            <p>
              {who.email} står ikke på listen over dem som kan skrive for nettsiden. Spør den som har ansvaret for
              nettsiden om å legge deg til.
            </p>
            <div className={styles.doorActions}>
              <LoggUt show={!testEditor()} className={styles.btn} />
            </div>
          </div>
        </div>
      </main>
    );
  }
  return <Shell email={who.email} counts={await counts()} canLogOut={!testEditor()}>{children}</Shell>;
}

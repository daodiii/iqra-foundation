import { redirect } from 'next/navigation';
import styles from '@/components/redaksjon/redaksjon.module.css';
import { testEditor } from '@/lib/redaksjon/access';

/**
 * Logging in: Clerk's form (a code or a link to the editor's email), set on the editor's own
 * sheet. With the test editor there is nothing to log in to.
 */
export default async function LoggInn() {
  if (testEditor()) redirect('/redaksjon');
  const { SignIn } = await import('@clerk/nextjs');
  return (
    <main className={styles.door}>
      <div className={styles.doorSheet}>
        <div className={styles.doorBrand}>
          <img src="/brand/iqra-mark.svg" alt="Iqra Foundation" />
          <span>Redaksjon</span>
        </div>
        <SignIn
          routing="path"
          path="/redaksjon/logg-inn"
          withSignUp={false}
          appearance={{ elements: { cardBox: { boxShadow: '0 1px 2px rgb(44 57 75 / .05), 0 8px 32px rgb(44 57 75 / .06)', borderRadius: '16px' }, footer: { display: 'none' } } }}
        />
      </div>
    </main>
  );
}

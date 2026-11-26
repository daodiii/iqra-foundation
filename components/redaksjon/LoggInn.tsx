'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './redaksjon.module.css';

/**
 * The login (2026-11-25, in place of Clerk): the address, then the code from the e-mail. Step 1 always
 * moves on to step 2, whether the address is on the list or not, so the page says nothing about who
 * is. The code is read leniently (case, spaces and the dash do not matter).
 */
export function LoggInn() {
  const router = useRouter();
  const [step, setStep] = useState<'epost' | 'kode'>('epost');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const post = (url: string, body: object) =>
    fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

  async function askForCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await post('/api/redaksjon/logg-inn/kode', { epost: email });
      if (!r.ok) throw new Error();
      setStep('kode');
    } catch {
      setError('Noe gikk galt. Prøv igjen om litt.');
    } finally {
      setBusy(false);
    }
  }

  async function logIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('kode') ?? '');
    setBusy(true);
    setError('');
    try {
      const r = await post('/api/redaksjon/logg-inn', { kode: code });
      if (r.ok) {
        // the session cookie is set: the editor's layout reads it on the way in
        router.replace('/redaksjon');
        router.refresh();
        return;
      }
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? 'Koden stemmer ikke.');
    } catch {
      setError('Noe gikk galt. Prøv igjen om litt.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.doorCard}>
      <h1>Logg inn</h1>
      {step === 'epost' ? (
        <form onSubmit={askForCode} noValidate={false}>
          <p>Skriv e-postadressen din, så sender vi deg en kode.</p>
          <label className={styles.doorField}>
            E-post
            <input
              className={styles.doorInput}
              type="email"
              name="epost"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <div className={styles.doorActions}>
            <button type="submit" className={`${styles.btn} ${styles.btnGo}`} disabled={busy}>
              Send kode
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={logIn}>
          <p>
            Står {email} på listen over redaktører, har vi sendt en kode dit. Den gjelder i 10 minutter.
          </p>
          <label className={styles.doorField}>
            Kode
            <input
              className={`${styles.doorInput} ${styles.doorCode}`}
              name="kode"
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              required
              placeholder="ABCD-2345"
            />
          </label>
          <div className={styles.doorActions}>
            <button type="submit" className={`${styles.btn} ${styles.btnGo}`} disabled={busy}>
              Logg inn
            </button>
            <button type="button" className={styles.btn} onClick={() => { setStep('epost'); setError(''); }}>
              Bruk en annen adresse
            </button>
          </div>
        </form>
      )}
      <p className={styles.doorError} role="alert">
        {error}
      </p>
    </div>
  );
}

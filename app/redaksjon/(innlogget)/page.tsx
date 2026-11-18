import styles from '@/components/redaksjon/redaksjon.module.css';

/** The start page. Its real content (the rail, three ways in, «Sist endret») comes with task 5. */
export default function Oversikt() {
  return (
    <main className={styles.door}>
      <div className={styles.doorSheet}>
        <div className={styles.doorCard}>
          <h1>Hva vil du dele i dag?</h1>
          <p>Redaksjonen bygges. Du er logget inn.</p>
        </div>
      </div>
    </main>
  );
}

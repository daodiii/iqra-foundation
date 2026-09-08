import { site } from '@/content/site.no';
import styles from './footer.module.css';

/**
 * Who we are, on every page. A site that asks for money and says it will report the gift
 * on an organisation number has to say what that number is somewhere other than inside
 * the panel doing the asking — it is the one line a visitor uses to check that there is
 * an organisation behind the page at all.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} {site.name}</span>
      <span className={styles.org}>
        {site.support.fields.orgnr} {site.support.orgnr} · {site.footer.place}
      </span>
      <a className={styles.link} href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
    </footer>
  );
}

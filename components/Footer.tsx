import { site } from '@/content/site.no';
import styles from './footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} {site.name}</span>
      <a className={styles.link} href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
    </footer>
  );
}

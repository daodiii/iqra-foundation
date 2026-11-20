import k from '@/components/forside/knapp.module.css';
import { site } from '@/content/site.no';
import type { Resource } from '@/lib/content';
import { writeDate } from '@/lib/dates';
import styles from './bokryggene.module.css';

const t = site.pages.resources;

/**
 * One resource in an open book: its title (a link to the file or the page), its date, the video
 * itself when it is one, its summary, and the way to it as an arrow link («Pilen» `ring`, drawn
 * from knapp.module.css on a plain link: a file or another site is no route for Next's Link).
 */
export function Utgivelse({ r }: { r: Resource }) {
  const href = r.file ?? r.url;
  const go = r.file ? { href: r.file, label: t.download } : r.url ? { href: r.url, label: t.open } : null;
  return (
    <li className={styles.item}>
      <h3 className={styles.h3}>{href ? <a href={href}>{r.title}</a> : r.title}</h3>
      <p className={styles.meta}>
        <time dateTime={r.date}>{writeDate(r.date)}</time>
      </p>
      {r.video && <video className={styles.video} src={r.video} controls preload="metadata" playsInline />}
      <p className={styles.summary}>{r.summary}</p>
      {go && (
        <a href={go.href} className={`${k.k} ${k.ring} ${styles.go}`} data-knapp="ring">
          <span className={k.label}>{go.label}</span>
          <span className={k.arrow} aria-hidden="true">
            <i>→</i>
            <i>→</i>
          </span>
        </a>
      )}
    </li>
  );
}

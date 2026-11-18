import type { Metadata } from 'next';
import styles from '@/components/site/page.module.css';
import { PageTitle } from '@/components/site/PageTitle';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { getPeople } from '@/lib/content';

export const metadata: Metadata = {
  title: site.pages.people.title,
  description: site.pages.people.description,
};

const t = klient.people;

/** The client's sentence with its e-mail address as a link; the words stay exactly theirs. */
function WithMailLink({ text }: { text: string }) {
  const email = site.contact.email;
  const at = text.indexOf(email);
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <a href={`mailto:${email}`}>{email}</a>
      {text.slice(at + email.length)}
    </>
  );
}

/**
 * Menneskene bak: the client's text (D4, 2026-11-18) and only the five board members (M4) —
 * name, role, and the photo and short bio when the foundation has supplied them (the
 * `menneskene` collection, edited in the admin). The foundation council is not shown, as the
 * client asks.
 */
export default function MenneskeneBak() {
  const people = getPeople();
  return (
    <article className={styles.page}>
      <PageTitle href="/menneskene-bak" className={styles.title}>{t.title}</PageTitle>
      <p className={styles.lede}>{t.intro}</p>

      <section className={styles.section} aria-labelledby="styret">
        <h2 id="styret">{t.board.title}</h2>
        <p>{t.board.text}</p>
        {people.length ? (
          <ul className={styles.list}>
            {people.map((p) => (
              <li key={p.slug} className={styles.item}>
                {p.photo && <img src={p.photo.src} alt={p.photo.alt} loading="lazy" />}
                <h3>{p.name}</h3>
                <p className={styles.meta}>{p.role}</p>
                {p.bio && <p>{p.bio}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>{site.pages.people.empty}</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="kontakt-styret">
        <h2 id="kontakt-styret">{t.contact.title}</h2>
        <p><WithMailLink text={t.contact.text} /></p>
      </section>
    </article>
  );
}

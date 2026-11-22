import { Lines } from '@/components/forside/Lines';
import { Plate, Plater } from '@/components/plater/Plater';
import { after } from '@/components/plater/after';
import p from '@/components/plater/plater.module.css';
import { copy } from '@/content/copy';
import type { Lang } from '@/content/paths';
import { site } from '@/content/site.no';
import type { Person } from '@/lib/content';
import styles from './menneskene-plater.module.css';

/**
 * A board member's role as the record writes it (in Norwegian, lower case), said in English on an
 * English page. A role not listed here is shown as written.
 */
const ROLES_EN: Record<string, string> = {
  styreleder: 'Chair',
  nestleder: 'Deputy chair',
  styremedlem: 'Board member',
  varamedlem: 'Deputy board member',
};
const roleIn = (role: string, lang: Lang) => (lang === 'en' ? (ROLES_EN[role.trim().toLowerCase()] ?? role) : role);

/**
 * The client's sentence with its e-mail address as a link; the words stay exactly theirs. The
 * address (and the full stop after it) stands on its own line, set large.
 */
export function WithMailLink({ text }: { text: string }) {
  const email = site.contact.email;
  const at = text.indexOf(email);
  if (at === -1) return <>{text}</>;
  let rest = text.slice(at + email.length);
  const stop = rest.startsWith('.');
  if (stop) rest = rest.slice(1);
  return (
    <>
      {text.slice(0, at)}
      <span className={styles.mline}>
        <a className={styles.mail} href={`mailto:${email}`}>
          {email}
        </a>
        {stop && '.'}
      </span>
      {rest}
    </>
  );
}

/** One board member under a heavy rule: the photo when there is one, the name set large, the role, the bio when there is one. */
function Member({ m, i, lang }: { m: Person; i: number; lang: Lang }) {
  return (
    <li className={styles.m} data-photo={m.photo ? '' : undefined} data-rise="" style={after(i * 0.08)}>
      {m.photo && <img className={styles.photo} src={m.photo.src} alt={m.photo.alt} loading="lazy" decoding="async" />}
      <div className={styles.who}>
        <h3 className={styles.name}>{m.name}</h3>
        <p className={styles.role}>{roleIn(m.role, lang)}</p>
      </div>
      {m.bio && <p className={styles.bio} lang={lang === 'en' ? 'nb' : undefined}>{m.bio}</p>}
    </li>
  );
}

/**
 * Menneskene bak as «Platene» (mock 42, the owner's pick of 2026-11-20): the title and the intro on
 * white; Styret on navy, its text beside the heading and the five board members under it, the names
 * set large under heavy rules with the role under each (a photo and a short bio only when supplied);
 * then Kontakt styret on white with the board's address set large. The foundation council is not shown.
 */
export function MenneskenePlater({ people, lang = 'no' }: { people: Person[]; lang?: Lang }) {
  const c = copy(lang);
  const t = c.klient.people;
  return (
    <Plater>
      <Plate tone="white" label="menneskene-tittel">
        <Lines as="h1" id="menneskene-tittel" className={p.h1} text={t.title} />
        <p className={p.intro} data-rise="">
          {t.intro}
        </p>
      </Plate>

      <Plate tone="navy" label="styret" data-part="board" data-empty={people.length ? undefined : ''}>
        <Lines as="h2" id="styret" className={p.h} text={t.board.title} />
        <p className={p.lede} data-rise="">
          {t.board.text}
        </p>
        {people.length ? (
          <ul className={styles.board}>
            {people.map((m, i) => (
              <Member key={m.slug} m={m} i={i} lang={lang} />
            ))}
          </ul>
        ) : (
          <p className={styles.empty} data-rise="">
            {c.site.pages.people.empty}
          </p>
        )}
      </Plate>

      <Plate tone="white" label="kontakt-styret" data-part="contact">
        <h2 id="kontakt-styret" className={styles.ch} data-rise="">
          {t.contact.title}
        </h2>
        <p className={styles.ct} data-rise="">
          <WithMailLink text={t.contact.text} />
        </p>
      </Plate>
    </Plater>
  );
}

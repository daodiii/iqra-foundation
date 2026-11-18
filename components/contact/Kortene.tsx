import type { ReactNode } from 'react';
import { site } from '@/content/site.no';
import { isPlaceholder } from '@/lib/placeholder';
import styles from './kortene.module.css';

/**
 * Kontakt as cards (13 Kortene, the owner's pick of 2026-09-22 after five rounds: «top modern
 * page with fantastic animations but still easy to read and find info»). On white, a grid of
 * cards, each one thing — the map the largest with the address written on it, the address
 * with the org.nr, the e-mail with where to follow, the number, and
 * the form down the right under «Kontakt oss» (the owner's word, the same day: no title over
 * the page, the heading on the form; «Kontakt» stays the page's name for the tab, the menu
 * and a reader, unseen). Every card is read at a glance;
 * they come up in reading order and the map flies in to the dot, and then everything
 * stands still. Every beat is the stylesheet's from the first paint: no hooks, nothing waits
 * for the page to be measured.
 *
 * The values are the client's (D8, 2026-11-18). The address is a post box, so the map has no
 * pin; Facebook and Instagram appear once their handles are supplied, never as «[INSTAGRAM]».
 * The client gave no opening hours or directions, so those two cards are gone.
 */

const t = site.pages.contact;
const c = site.contact;

/** The address, as it is written on the card and on the map: the post box, then the postcode and the place. */
const ADDRESS = c.address;

/** Where to follow, only the names whose handle is real: none is shown while every one is bracketed. */
const FOLLOW = c.follow.filter((l) => !isPlaceholder(l.href));

/**
 * The map: OpenStreetMap's tiles in the site's navy (the image is grey, shown through a
 * luminosity blend over navy, so the streets read as light lines), flown in from close over
 * the address out to the district. The image is stitched with the address at its exact
 * centre (scripts/dev/kart.mjs), so the dot at 50%/50% is on it under `object-fit: cover`;
 * the dot lands only once the address is real (`located`). Two files of the same ground,
 * and `sizes` says how wide the card is, so a phone takes the small one — the map is the
 * page's largest paint. The credit is the licence's condition.
 */
export function Kart({ located }: { located: boolean }) {
  return (
    <figure className={styles.kart}>
      <img
        src="/kart-1024.webp"
        srcSet="/kart-1024.webp 1024w, /kart-1536.webp 1536w"
        sizes="(max-width: 899px) calc(100vw - 40px), 40vw"
        width={1024}
        height={768}
        alt={t.map.alt}
        className={styles.kartImg}
        fetchPriority="high"
        decoding="async"
      />
      {located && <span className={styles.pin} data-pin aria-hidden="true" />}
      <figcaption className={styles.credit}>
        <a href={t.map.creditHref}>{t.map.credit}</a>
      </figcaption>
    </figure>
  );
}

/** Where to follow: each name a link to its real handle. */
function Follow() {
  return (
    <span className={styles.follow}>
      {FOLLOW.map((l, i) => (
        <span key={l.name}>
          {i > 0 && <span className={styles.sep} aria-hidden="true">·</span>}
          <a href={l.href}>{l.name}</a>
        </span>
      ))}
    </span>
  );
}

/** One drawn field: its name and a hairline box. */
function Field({ label }: { label: string }) {
  return (
    <span className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldBox} />
    </span>
  );
}

/**
 * The form, drawn for the eye: spans, not controls, and hidden from a reader, since nothing
 * is wired. The writer's name and e-mail, their mobile and organisation number side by side,
 * the message, Send. The line under it says so.
 */
function Form() {
  const f = t.form;
  return (
    <div className={styles.formWrap}>
      <div className={styles.form} data-form aria-hidden="true">
        <Field label={f.name} />
        <Field label={f.email} />
        <span className={styles.pair}>
          <Field label={f.mobile} />
          <Field label={f.orgnr} />
        </span>
        <span className={styles.field}>
          <span className={styles.fieldLabel}>{f.message}</span>
          <span className={`${styles.fieldBox} ${styles.area}`} />
        </span>
        <span className={styles.send}>{f.send}</span>
      </div>
      <p className={styles.notice}>{f.notice}</p>
    </div>
  );
}

/** One card: its name as a heading and, under it, the value as large as the card allows. `data-card` is its place in the grid and in the arrival. */
function Card({ area, label, className, children }: { area: string; label?: string; className?: string; children: ReactNode }) {
  return (
    <div className={`${styles.card} ${className ?? ''}`} data-card={area}>
      {label && <h2 className={styles.cardLabel}>{label}</h2>}
      {children}
    </div>
  );
}

export function Kortene() {
  return (
    <article className={styles.kortene}>
      <h1 className="visually-hidden">{t.title}</h1>
      <div className={styles.bento}>
        <Card area="kart" className={styles.mapCard}>
          {/* A post box is not a place on the map: no pin. */}
          <Kart located={false} />
          <span className={styles.onMap}>{ADDRESS.join(', ')}</span>
        </Card>
        <Card area="adresse" label={t.addressLabel}>
          <p className={styles.cardValue}>
            {ADDRESS.map((l) => (
              <span key={l} className={styles.line}>{l}</span>
            ))}
          </p>
          <p className={styles.cardSmall}>{t.orgnrLabel} {c.orgnr}</p>
        </Card>
        <Card area="epost" label={t.emailLabel}>
          {/* A break opportunity before the «@», so a narrow card splits the address there and not mid-name. */}
          <p className={`${styles.cardValue} ${styles.mail}`}><a href={`mailto:${c.email}`}>{c.email.split('@')[0]}<wbr />@{c.email.split('@')[1]}</a></p>
          {FOLLOW.length > 0 && <p className={styles.cardSmall}>{t.followLabel} <Follow /></p>}
        </Card>
        <Card area="skjema" className={styles.formCard}>
          <h2 className={styles.formTitle}>{t.form.title}</h2>
          <Form />
        </Card>
        <Card area="telefon" label={t.phoneLabel}>
          <p className={styles.cardValue}><a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a></p>
        </Card>
      </div>
    </article>
  );
}

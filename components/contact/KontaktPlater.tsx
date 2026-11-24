import type { ReactNode } from 'react';
import { Lines } from '@/components/forside/Lines';
import { Plate, Plater } from '@/components/plater/Plater';
import { after } from '@/components/plater/after';
import p from '@/components/plater/plater.module.css';
import { copy } from '@/content/copy';
import type { Lang } from '@/content/paths';
import { KontaktSkjema } from './KontaktSkjema';
import styles from './kontakt-plater.module.css';


/** One way to reach the foundation, as a line between rules: its label, then its value set large. A link when there is somewhere to go. */
function Way({ way, href, label, i, children }: { way: string; href?: string; label: string; i: number; children: ReactNode }) {
  const body = (
    <>
      <span className={styles.lb} id={`kontakt-${way}`}>
        {label}
      </span>
      <span className={styles.vl}>{children}</span>
    </>
  );
  return (
    <li className={styles.row} data-rise="" style={after(i * 0.1)}>
      {href ? (
        <a className={styles.w} href={href} data-way={way}>
          {body}
        </a>
      ) : (
        <div className={styles.w} data-way={way}>
          {body}
        </div>
      )}
    </li>
  );
}

/**
 * Kontakt as «Platene» (mock 42, the owner's pick of 2026-11-20): the title and the page's text on
 * white; the three ways to reach the foundation on navy as lines between rules, the e-mail at poster
 * size; the form under «Kontakt oss» on white.
 *
 * The ways have no heading of their own in the content, so their plate is named by their three labels.
 * The form (KontaktSkjema) keeps the drawn look, hairline fields and Send as «Pilen», as real controls
 * that send to the foundation's inbox.
 */
export function KontaktPlater({ lang = 'no' }: { lang?: Lang }) {
  const { site } = copy(lang);
  const t = site.pages.contact;
  const c = site.contact;
  const f = t.form;
  return (
    <Plater>
      <Plate tone="white" label="kontakt-tittel">
        <Lines as="h1" id="kontakt-tittel" className={p.h1} text={t.title} />
        <p className={p.intro} data-rise="">
          {t.description}
        </p>
      </Plate>

      <Plate tone="navy" label="kontakt-epost kontakt-telefon kontakt-adresse" data-part="ways">
        <ul className={styles.ways}>
          <Way way="epost" href={`mailto:${c.email}`} label={t.emailLabel} i={0}>
            {c.email}
          </Way>
          <Way way="telefon" href={`tel:${c.phone.replace(/\s/g, '')}`} label={t.phoneLabel} i={1}>
            {c.phone}
          </Way>
          <Way way="adresse" label={t.addressLabel} i={2}>
            {c.address.join(', ')}
            <small>
              {t.orgnrLabel} {c.orgnr}
            </small>
          </Way>
        </ul>
      </Plate>

      <Plate tone="white" label="kontakt-skjema" data-part="form">
        <Lines as="h2" id="kontakt-skjema" className={p.h} text={f.title} />
        <KontaktSkjema f={f} email={c.email} />
      </Plate>
    </Plater>
  );
}

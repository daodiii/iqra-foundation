'use client';

import { useEffect, useRef, useState } from 'react';
import { site } from '@/content/site.no';
import { createDrape, type DrapeHandle } from '@/lib/drape';
import { EASE, gsap, reducedMotion, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { setWordmarkOnDark } from '@/lib/wordmark';
import styles from './support.module.css';

const support = site.support;
const tiers = support.tiers;

/**
 * nb-NO groups thousands with a non-breaking space. Written out rather than left to
 * `toLocaleString`, whose output depends on the ICU data the renderer happens to carry —
 * and this component renders on the server as well as in the browser, where a difference
 * of one space is a hydration mismatch.
 */
function kroner(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** The field spreads as the amount goes up, so the largest gift fills the section past
 *  its own edges. Nobody will name it, which is the same bargain as Misjon's full stop. */
const coverFor = (i: number) => 0.86 + 0.3 * (i / (tiers.length - 1));

/**
 * Støtt oss, at the foot of the page: the drape from Misjon opened up to fill a dark
 * section, with one amount on it. The section asks a single question, so everything on
 * it is one decision — how much, how often, and then the one button.
 *
 * The second way to pay follows the frequency rather than sitting beside the first.
 * Vipps handles both a single gift and a standing one, AvtaleGiro exists only for the
 * recurring case, and a plain transfer only makes sense for the one-off, so offering all
 * three at once would leave one of them wrong whichever way the toggle is set.
 */
export function Support() {
  const root = useRef<HTMLElement>(null);
  const drape = useRef<DrapeHandle | null>(null);
  const cover = useRef(coverFor(1));
  const panel = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(1);
  const [monthly, setMonthly] = useState(false);
  const [open, setOpen] = useState(false);

  useGSAP(
    () => {
      const section = root.current;
      if (!section) return;
      const canvas = section.querySelector('canvas');
      const reduced = reducedMotion();

      // One mode at every width: a field covers the whole section, so unlike Misjon
      // there is no narrow layout for it to be rebuilt into.
      if (canvas) {
        drape.current = createDrape(canvas, {
          reduced, mode: 'field', palette: 'deep', cover: cover.current,
        });
      }

      // The first dark ground since the hero, so the wordmark and the nav have to come
      // back to white here — and go navy again on the way back up into Misjon, which
      // says so itself but only once its own start is crossed.
      const watcher = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        onEnter: () => setWordmarkOnDark(true),
        onEnterBack: () => setWordmarkOnDark(true),
        onLeaveBack: () => setWordmarkOnDark(false),
        onRefresh: (self) => { if (self.isActive) setWordmarkOnDark(true); },
      });

      const cleanup = () => {
        watcher.kill();
        drape.current?.destroy();
        drape.current = null;
      };
      if (reduced) return cleanup;

      const rise = section.querySelectorAll<HTMLElement>('[data-rise]');
      // `opacity`, never `autoAlpha`: autoAlpha adds visibility:hidden, which would take
      // the amount and every control out of the accessibility tree until a scroll event
      // that may never arrive. Set here rather than in the stylesheet so a script that
      // never runs leaves the section readable instead of blank.
      gsap.set(rise, { opacity: 0, y: 22 });

      const tl = gsap.timeline({ paused: true });
      tl.to(rise, { opacity: 1, y: 0, duration: 0.95, ease: EASE.out, stagger: 0.105 });
      const entrance = ScrollTrigger.create({
        trigger: section, start: 'top 72%', once: true, onEnter: () => tl.play(),
      });

      return () => { entrance.kill(); cleanup(); };
    },
    { scope: root },
  );

  // The drape is built in a layout effect above, so it exists by the time this runs.
  useEffect(() => {
    const handle = drape.current;
    if (!handle) return;
    const to = coverFor(idx);
    if (reducedMotion()) {
      cover.current = to;
      handle.setCover(to);
      return;
    }
    const tween = gsap.to(cover, {
      current: to, duration: 0.9, ease: EASE.out,
      onUpdate: () => handle.setCover(cover.current),
    });
    return () => { tween.kill(); };
  }, [idx]);

  useEffect(() => {
    if (!open) return;
    // The section is centred on the viewport, so opening the panel pushes the account
    // number below the fold. Bring it back once the panel has finished opening.
    const t = window.setTimeout(() => {
      panel.current?.scrollIntoView?.({
        block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth',
      });
    }, 420);
    return () => window.clearTimeout(t);
  }, [open]);

  const tier = tiers[idx];
  const amount = kroner(tier.kr);
  const unit = monthly ? support.unit.month : support.unit.once;
  const give = (monthly ? support.give.month : support.give.once).replace('{beløp}', amount);
  const detail = monthly ? support.avtalegiro : support.transfer;
  const f = support.fields;
  const rows: [string, string][] = monthly
    ? [
        [f.account, support.account],
        [f.kid, support.kid],
        [f.amount, `${amount} ${support.unit.month}`],
        [f.orgnr, support.orgnr],
      ]
    : [
        [f.account, support.account],
        [f.amount, `${amount} ${support.unit.once}`],
        [f.vipps, support.vippsNumber],
        [f.orgnr, support.orgnr],
      ];

  return (
    <section ref={root} id="stott-oss" className={styles.support} aria-labelledby="stott-label">
      <canvas className={styles.field} aria-hidden="true" />
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.inner}>
        <p id="stott-label" className={styles.label} data-rise>{support.label}</p>

        <div className={styles.figure} data-rise aria-live="polite">
          <p className={styles.amount} data-amount>
            {amount}{' '}
            <span className={styles.unit}>{unit}</span>
          </p>
          <p className={styles.outcome} data-outcome>{monthly ? tier.month : tier.once}</p>
        </div>

        <div className={styles.controls} data-rise>
          <div className={styles.toggle} role="group" aria-label={support.frequency.label}>
            <button type="button" aria-pressed={!monthly} onClick={() => setMonthly(false)}>
              {support.frequency.once}
            </button>
            <button type="button" aria-pressed={monthly} onClick={() => setMonthly(true)}>
              {support.frequency.month}
            </button>
          </div>
          <div className={styles.tiers} role="group" aria-label={support.amountLabel}>
            {tiers.map((t, i) => (
              <button
                key={t.kr}
                type="button"
                className={styles.tier}
                aria-pressed={i === idx}
                onClick={() => setIdx(i)}
              >
                {kroner(t.kr)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.pay} data-rise>
          {/*
            Vipps is the button because it is how people here actually pay, and its own
            orange is the one colour on the site from outside the palette. The word is
            set in the site's own type on purpose: the Vipps logotype is a trademark and
            must be their SVG or nothing, never a lookalike in whatever face is to hand.
            Both the mark and this orange need checking against their brand guidelines
            before launch, and the button needs somewhere to go.
          */}
          <button type="button" className={styles.vipps}>{give}</button>

          <button
            type="button"
            className={styles.alt}
            aria-expanded={open}
            aria-controls="stott-detaljer"
            onClick={() => setOpen((v) => !v)}
          >
            {monthly ? support.alt.month : support.alt.once}
            <span className={styles.chevron} aria-hidden="true" />
          </button>

          <div id="stott-detaljer" ref={panel} className={styles.details} data-open={open}>
            <div className={styles.detailsClip}>
              <div className={styles.detailsBox} inert={!open}>
                <h3 className={styles.detailsTitle}>{detail.title}</h3>
                <p className={styles.detailsPara}>{detail.para}</p>
                <dl className={styles.rows}>
                  {rows.map(([key, value]) => (
                    <div key={key} className={styles.row}>
                      <dt>{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>

          <p className={styles.tax}>{support.tax}</p>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { areas } from '@/components/home/areas';
import { Hero } from '@/components/home/Hero';
import home from '@/components/home/home.module.css';
import { Box } from '@/components/materials/Box';
import { Frame } from '@/components/materials/Frame';
import mat from '@/components/materials/materials.module.css';
import { Logo, type Ground as LogoGround } from '@/components/site/Logo';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import work from '@/app/vart-arbeid/work.module.css';
import styles from './mock.module.css';
import {
  GROUNDS, MATERIALS, PIGMENTS, inkPaletteFor, lookFromString, lookToString, stillFor, toneOf, waterFloorFor,
  type GroundName, type Look, type MaterialName, type PigmentName,
} from './palettes';

/**
 * The mock: the home page and Vårt arbeid as one long page whose every section can be
 * switched live between ink, water and a flat plate, on any of the guide's grounds, with
 * any of its colours as the pigment. The presets are the three mappings that were the
 * question; the chips above each section are the answer space. The state is in the URL
 * hash, so a look can be sent back as a link.
 */

type SectionKey = 'vm' | 'areas' | 'w1' | 'w2' | 'w3' | 'w4';
type State = Record<SectionKey, Look>;

const L = (material: MaterialName, ground: GroundName, pigment: PigmentName): Look => ({ material, ground, pigment });

const PRESETS: readonly { key: string; name: string; note: string; state: State }[] = [
  {
    key: 'idag',
    name: 'A i dag',
    note: 'Slik retning A står: turkis blekk, turkis vann, annenhver plate.',
    state: { vm: L('ink', 'light', 'turquoise'), areas: L('water', 'turquoise', 'turquoise'), w1: L('ink', 'light', 'turquoise'), w2: L('water', 'turquoise', 'turquoise'), w3: L('ink', 'light', 'turquoise'), w4: L('water', 'turquoise', 'turquoise') },
  },
  {
    key: 'rekkefolge',
    name: 'Paletten i rekkefølge',
    note: 'Fargene hører til sidens rytme: marineblekk, turkis vann, burgunderblekk, marine natt.',
    state: { vm: L('ink', 'light', 'navy'), areas: L('water', 'turquoise', 'turquoise'), w1: L('ink', 'light', 'navy'), w2: L('water', 'turquoise', 'turquoise'), w3: L('ink', 'light', 'crimson'), w4: L('water', 'navy', 'turquoise') },
  },
  {
    key: 'omrade',
    name: 'Farge per område',
    note: 'Hvert område eier en farge, som i C, og materialet bærer den. De fire feltene uten nummer.',
    state: { vm: L('ink', 'light', 'turquoise'), areas: L('flat', 'white', 'turquoise'), w1: L('ink', 'navy', 'light'), w2: L('water', 'turquoise', 'turquoise'), w3: L('water', 'light', 'turquoise'), w4: L('ink', 'crimson', 'light') },
  },
  {
    key: 'blandet',
    name: 'To materialer, alle fargene',
    note: 'Bare blekk og vann, men marine, turkis og burgunder sammen i samme grunn.',
    state: { vm: L('ink', 'light', 'mixed'), areas: L('water', 'turquoise', 'mixed'), w1: L('ink', 'light', 'mixed'), w2: L('water', 'white', 'mixed'), w3: L('ink', 'light', 'mixed'), w4: L('water', 'turquoise', 'mixed') },
  },
];

const KEYS: readonly SectionKey[] = ['vm', 'areas', 'w1', 'w2', 'w3', 'w4'];

const NB: { material: Record<MaterialName, string>; ground: Record<GroundName, string>; pigment: Record<PigmentName, string> } = {
  material: { ink: 'blekk', water: 'vann', flat: 'flate' },
  ground: { white: 'hvit', light: 'lys', navy: 'marine', turquoise: 'turkis', crimson: 'burgunder' },
  pigment: { navy: 'marine', turquoise: 'turkis', crimson: 'burgunder', light: 'lys', mixed: 'blandet' },
};

type Snapshot = { preset: string; state: State };

const SERVER: Snapshot = { preset: PRESETS[0].key, state: PRESETS[0].state };

function readHash(): Snapshot {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const preset = PRESETS.find((p) => p.key === params.get('p')) ?? PRESETS[0];
  const state = { ...preset.state };
  for (const k of KEYS) state[k] = lookFromString(params.get(k) ?? undefined, preset.state[k]);
  return { preset: preset.key, state };
}

/*
 * The URL hash is the state: what is shown is what the address says, so a look can be sent
 * back as a link and the page reloads to it. Reads are cached per hash so the snapshot is
 * stable; writes go through `commit`, which updates the hash and tells the subscribers
 * (`replaceState` fires no event of its own).
 */
let cached: { hash: string; value: Snapshot } | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Snapshot {
  const hash = window.location.hash;
  if (!cached || cached.hash !== hash) cached = { hash, value: readHash() };
  return cached.value;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('hashchange', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('hashchange', cb);
  };
}

function commit(preset: string, state: State) {
  const params = new URLSearchParams();
  params.set('p', preset);
  const base = PRESETS.find((p) => p.key === preset)!;
  for (const k of KEYS) if (lookToString(state[k]) !== lookToString(base.state[k])) params.set(k, lookToString(state[k]));
  window.history.replaceState(null, '', `#${params.toString()}`);
  listeners.forEach((l) => l());
}

export function MockPage() {
  const { preset, state } = useSyncExternalStore(subscribe, getSnapshot, () => SERVER);

  const pick = useCallback((key: string) => {
    const p = PRESETS.find((x) => x.key === key)!;
    commit(p.key, p.state);
  }, []);

  const set = useCallback((k: SectionKey, patch: Partial<Look>) => {
    const now = getSnapshot();
    commit(now.preset, { ...now.state, [k]: { ...now.state[k], ...patch } });
  }, []);

  const current = PRESETS.find((p) => p.key === preset) ?? PRESETS[0];

  return (
    <div className={styles.mock} data-plates>
      <div className={styles.bar} role="group" aria-label="Utgangspunkt">
        <div className={styles.tabs}>
          {PRESETS.map((p) => (
            <button key={p.key} type="button" className={styles.tab} aria-pressed={p.key === preset} onClick={() => pick(p.key)}>
              {p.name}
            </button>
          ))}
        </div>
        <p className={styles.note}>{current.note}</p>
      </div>

      <Hero />

      <div className={home.plates}>
        <Section label="Visjon og misjon" k="vm" look={state.vm} set={set}>
          <Plate look={state.vm} className={home.inkBox} flat={<VmFlat look={state.vm} />}>
            <div className={home.pair}>
              <section aria-labelledby="visjon-tittel" id="visjon">
                <Frame legend={site.pages.home.visionLabel} legendId="visjon-tittel" level="h2">
                  <h3 className={mat.title}>{brief.vision.headline}</h3>
                  <p className={mat.text}>{brief.vision.paragraph}</p>
                </Frame>
              </section>
              <section aria-labelledby="misjon-tittel" id="misjon">
                <Frame legend={site.pages.home.missionLabel} legendId="misjon-tittel" level="h2">
                  <h3 className={mat.title}>{brief.mission.headline}</h3>
                  <p className={mat.text}>{brief.mission.paragraph}</p>
                </Frame>
              </section>
            </div>
          </Plate>
        </Section>

        <Section label="Fire hovedområder" k="areas" look={state.areas} set={set} flatFixed>
          <Plate look={state.areas} className={home.waterBox} flat={<Fields />}>
            <h2 className="visually-hidden">{site.pages.home.areasLabel}</h2>
            <ul className={home.areas}>
              {brief.areas.map((a) => (
                <li key={a.key}>
                  <Frame legend={a.name} level="h3" href={`/vart-arbeid#${a.key}`} dot>
                    <p className={mat.text}>{a.text}</p>
                  </Frame>
                </li>
              ))}
            </ul>
          </Plate>
        </Section>
      </div>

      <header className={work.head}>
        <h2 className={work.title}>{site.pages.work.title}</h2>
        <p className={work.lede}>{brief.mission.headline}</p>
      </header>
      <div className={work.plates}>
        {brief.areas.map((a, i) => {
          const k = `w${i + 1}` as SectionKey;
          const look = state[k];
          return (
            <Section key={a.key} label={a.name} k={k} look={look} set={set}>
              <section id={a.key} className={`${work.area} ${i % 2 ? work.right : work.left}`} aria-labelledby={`${a.key}-tittel`}>
                <Plate look={look} className={work.box} flat={<Band area={areas[i]} look={look} headingId={`${a.key}-tittel`} />}>
                  <Frame legend={a.name} legendId={`${a.key}-tittel`} level="h2" dot className={work.card}>
                    <p className={mat.text}>{a.text}</p>
                  </Frame>
                </Plate>
              </section>
            </Section>
          );
        })}
      </div>
    </div>
  );
}

/** A section of the mock: its chip of controls, then the box. */
function Section({ label, k, look, set, flatFixed = false, children }: {
  label: string; k: SectionKey; look: Look; set: (k: SectionKey, patch: Partial<Look>) => void; flatFixed?: boolean; children: ReactNode;
}) {
  const flat = look.material === 'flat';
  return (
    <div className={styles.section}>
      <div className={styles.chip}>
        <span className={styles.chipLabel}>{label}</span>
        <Select id={`${k}-m`} label="Materiale" value={look.material} options={MATERIALS} names={NB.material} onChange={(v) => set(k, { material: v as MaterialName })} />
        <Select id={`${k}-g`} label="Grunn" value={look.ground} options={GROUNDS} names={NB.ground} onChange={(v) => set(k, { ground: v as GroundName })} disabled={flat && flatFixed} />
        <Select id={`${k}-p`} label="Pigment" value={look.pigment} options={PIGMENTS} names={NB.pigment} onChange={(v) => set(k, { pigment: v as PigmentName })} disabled={flat} />
      </div>
      {children}
    </div>
  );
}

function Select<T extends string>({ id, label, value, options, names, onChange, disabled = false }: {
  id: string; label: string; value: T; options: readonly T[]; names: Record<T, string>; onChange: (v: T) => void; disabled?: boolean;
}) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o} value={o}>{names[o]}</option>)}
      </select>
    </label>
  );
}

/**
 * A box of the look: ink or water through `Box`, with a palette and a floor derived for the
 * ground and the pigment, remounted (keyed) on every change so each look gets a fresh
 * canvas; or the flat rendering the section supplies.
 */
function Plate({ look, className, flat, children }: { look: Look; className?: string; flat: ReactNode; children: ReactNode }) {
  const palette = useMemo(() => inkPaletteFor(look.ground, look.pigment), [look.ground, look.pigment]);
  const floor = useMemo(() => waterFloorFor(look.ground, look.pigment), [look.ground, look.pigment]);
  const style = useMemo(() => stillFor(look), [look]);
  if (look.material === 'flat') return <>{flat}</>;
  return (
    <Box
      key={lookToString(look)}
      material={look.material}
      palette={palette}
      floor={floor}
      tone={toneOf(look.ground)}
      ground={look.ground}
      className={className}
      style={style}
    >
      {children}
    </Box>
  );
}

const LOGO_GROUND: Record<GroundName, LogoGround> = { white: 'white', light: 'light', navy: 'navy', turquoise: 'turquoise', crimson: 'crimson' };

/** Visjon and Misjon on a flat plate of the ground: type in the tone's colours, no frames. */
function VmFlat({ look }: { look: Look }) {
  return (
    <div className={`${styles.flat} ${home.inkBox}`} data-tone={toneOf(look.ground)} style={stillFor(look)}>
      <div className={home.pair}>
        <section aria-labelledby="visjon-tittel" id="visjon" className={styles.flatCard}>
          <p className={styles.flatLabel} id="visjon-tittel">{site.pages.home.visionLabel}</p>
          <h3 className={styles.flatTitle}>{brief.vision.headline}</h3>
          <p className={styles.flatText}>{brief.vision.paragraph}</p>
        </section>
        <section aria-labelledby="misjon-tittel" id="misjon" className={styles.flatCard}>
          <p className={styles.flatLabel} id="misjon-tittel">{site.pages.home.missionLabel}</p>
          <h3 className={styles.flatTitle}>{brief.mission.headline}</h3>
          <p className={styles.flatText}>{brief.mission.paragraph}</p>
        </section>
      </div>
      <span className={styles.flatLogo}><Logo ground={LOGO_GROUND[look.ground]} height={28} decorative /></span>
    </div>
  );
}

/** Direction C's four fields, each in its area's colour, without the numbers. */
function Fields() {
  return (
    <section aria-label={site.pages.home.areasLabel} className={styles.fieldsWrap}>
      <ul className={styles.fields} data-fields>
        {areas.map((a) => (
          <li key={a.key} className={styles.item} style={{ '--field': `var(${a.token})`, '--field-text': `var(${a.ink})`, '--field-heading': `var(${a.headingInk})`, '--field-ring': `var(${a.ring})` } as React.CSSProperties} data-ground={a.ground}>
            <Link href={a.href} prefetch={false} className={styles.cell} aria-labelledby={`felt-${a.key}`}>
              <h3 id={`felt-${a.key}`} className={styles.name}>{a.name}</h3>
              <p className={styles.text}>{a.text}</p>
              <span className={styles.logo}><Logo ground={a.ground} height={28} decorative /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One area of Vårt arbeid as a flat band of the ground, C's band without the number. */
function Band({ area, look, headingId }: { area: (typeof areas)[number]; look: Look; headingId: string }) {
  return (
    <div className={`${styles.flat} ${styles.band} ${work.box}`} data-tone={toneOf(look.ground)} style={stillFor(look)}>
      <h2 id={headingId} className={styles.flatTitle}>{area.name}</h2>
      <p className={styles.flatText}>{area.text}</p>
      <span className={styles.flatLogo}><Logo ground={LOGO_GROUND[look.ground]} height={28} decorative /></span>
    </div>
  );
}

import { klient } from '@/content/klient.no';
import { Lines } from '@/components/forside/Lines';
import { Plate, Plater } from '@/components/plater/Plater';
import { after } from '@/components/plater/after';
import p from '@/components/plater/plater.module.css';

const t = klient.about;

/**
 * Om Iqra Foundation as «Platene» (mock 42, the owner's pick of 2026-11-20): the title and the intro on
 * white, then a plate for each part in the client's order and words — the purpose on navy, the values
 * on white, who it is for on burgundy, the independence on the deep navy. «Navnet Iqra» is left out by the
 * owner.
 */
export function OmOssPlater() {
  return (
    <Plater>
      <Plate tone="white" label="om-tittel">
        <Lines as="h1" id="om-tittel" className={p.h1} text={t.title} />
        <p className={p.intro} data-rise="">
          {t.intro}
        </p>
      </Plate>

      <Plate tone="navy" label="om-formal" data-part="purpose">
        <Lines as="h2" id="om-formal" className={p.h} text={t.purpose.title} />
        <p className={p.lede} data-rise="">
          {t.purpose.lead}
        </p>
        <ul className={p.lines}>
          {t.purpose.points.map((s, i) => (
            <li key={s} data-rise="" style={after(i * 0.1)}>
              {s}
            </li>
          ))}
        </ul>
      </Plate>

      <Plate tone="white" label="om-verdier" data-part="values">
        <Lines as="h2" id="om-verdier" className={p.h} text={t.values.title} />
        <p className={p.lede} data-rise="">
          {t.values.lead}
        </p>
        <ul className={p.cols} data-one-on-phone="">
          {t.values.points.map((v, i) => (
            <li key={v.name} data-rise="" style={after(i * 0.08)}>
              <b>{v.name}</b>
              <span>{v.text}</span>
            </li>
          ))}
        </ul>
        <p className={p.note} data-rise="">
          {t.values.close}
        </p>
      </Plate>

      <Plate tone="rod" label="om-hvem" mid data-part="audience">
        <h2 id="om-hvem" className={p.small} data-rise="">
          {t.audience.title}
        </h2>
        <Lines className={p.say} text={t.audience.text} />
      </Plate>

      <Plate tone="deep" label="om-stiftelse" data-part="independent">
        <Lines as="h2" id="om-stiftelse" className={p.h} text={t.independent.title} />
        <div className={p.two}>
          {t.independent.paragraphs.map((s, i) => (
            <p key={s.slice(0, 24)} data-rise="" style={after(i * 0.1)}>
              {s}
            </p>
          ))}
        </div>
      </Plate>
    </Plater>
  );
}

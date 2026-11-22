import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { klient } from './klient.no';

/**
 * The client's text, word for word, both ways.
 *
 * One way: every string in `klient.no.ts` is in the client's sources
 * (`docs/prompts/2026-11-18-klient-oppdatering.md`), so a reworded sentence fails here.
 * The other way: every paragraph of the client's document (D) is in `klient.no.ts`, so a
 * sentence the client wrote cannot be left out by accident. What a paragraph may hold beyond
 * the strings is listed in LEFTOVERS, each with its reason.
 */
const FILE = path.resolve(process.cwd(), 'docs/prompts/2026-11-18-klient-oppdatering.md');
/**
 * The one change to the client's words since: the foundation's e-mail is post@iqrasti.no (the
 * owner, 2026-11-19), in the contact line and in «Kontakt styret». The sources keep the old
 * address as the client wrote it; the test reads them with the new one in its place.
 */
const EMAIL = { old: 'iqrafoundation25@gmail.com', now: 'post@iqrasti.no' };
const file = readFileSync(FILE, 'utf8').replaceAll(EMAIL.old, EMAIL.now);

/** Markdown emphasis off, whitespace collapsed: what a reader of the sources sees. */
const plain = (s: string) => s.replace(/\*/g, '').replace(/\s+/g, ' ').trim();

/**
 * Option D from the plain-copy proposal, without «du», on all the client's prose (the owner,
 * 2026-11-22): the client's words on the left, the site's on the right. The test reads the sources with each rewrite in
 * place, so both directions still hold; every left side must still be in the sources.
 */
const REWRITES: [string, string][] = [
  [
    'Iqra Foundation er en allmennyttig stiftelse i Oslo som arbeider for kunnskap, dialog, gjensidig forståelse og aktiv samfunnsdeltakelse. Arbeidet vårt bygger på islamske verdier og prinsipper, og retter seg særlig mot ungdom og voksne.',
    'Iqra Foundation er en allmennyttig stiftelse i Oslo, bygget på islamske verdier og prinsipper. Vi arbeider for kunnskap og dialog, og for at folk skal forstå hverandre og ta aktivt del i samfunnet. Vi retter oss særlig mot ungdom og voksne.',
  ],
  [
    'Vi skaper møteplasser der mennesker kan lære, utveksle erfaringer og ta ansvar – for egen utvikling og for samfunnet rundt seg.',
    'På møteplassene våre kan folk lære, dele erfaringer og ta ansvar for egen utvikling og for samfunnet rundt seg.',
  ],
  [
    'Kunnskap gir mennesker forutsetninger for å forstå sin egen situasjon, delta i samfunnet og påvirke det. Samtidig skapes tillit og fellesskap når mennesker med ulik bakgrunn møtes, lytter og samarbeider.',
    'Med kunnskap kan mennesker forstå sin egen situasjon, delta i samfunnet og påvirke det. Når folk med ulik bakgrunn møtes, lytter og samarbeider, vokser det fram tillit og fellesskap.',
  ],
  [
    'Iqra Foundation er opprettet for å bygge en varig og uavhengig plattform for nettopp dette: et sted der læring, refleksjon og engasjement kan utvikles over tid, og der mennesker får verktøy til å bidra aktivt i det norske samfunnet.',
    'Iqra Foundation ble opprettet for å gi dette et varig og uavhengig sted. Her skal læring og engasjement få tid til å vokse. Folk skal få verktøy til å bidra aktivt i det norske samfunnet.',
  ],
  [
    'Vi arbeider for å etablere fysiske og digitale arenaer for læring, dialog og fellesskap. På sikt er målet å utvikle egne lokaler, som læringssenter, aktivitetssenter og konferansearena, som kan tjene både stiftelsens virksomhet og andre aktører med beslektede formål.',
    'Vi vil skape steder der folk kan lære og møtes, fysisk og på nett. På sikt ønsker vi egne lokaler, for eksempel et læringssenter, et aktivitetssenter og en konferansearena. Stiftelsen skal bruke dem selv, og andre med beslektede formål skal også kunne bruke dem.',
  ],
  [
    'Iqra Foundation STI er en privat, selveiende og allmennyttig stiftelse med forretningskontor i Oslo (org.nr. 817 388 752). Stiftelsen er opprettet og drives i samsvar med lov om stiftelser og er underlagt tilsyn av Stiftelsestilsynet.',
    'Iqra Foundation STI er en allmennyttig stiftelse med forretningskontor i Oslo. Den er privat og selveiende, og organisasjonsnummeret er 817 388 752. Stiftelsen er opprettet og drives etter lov om stiftelser, og Stiftelsestilsynet fører tilsyn med den.',
  ],
  [
    'Kunnskap skal være tilgjengelig og kunne deles. I ressursbiblioteket samler vi materiale som bidrar til læring, refleksjon og forståelse.',
    'Kunnskap skal være lett å finne og lett å dele. I ressursbiblioteket samler vi materiale for læring og ettertanke.',
  ],
  [
    'Fordypende innhold om kunnskap, dialog, samfunnsdeltakelse og fellesskap.',
    'Lengre tekster om dialog, samfunnsdeltakelse og fellesskap.',
  ],
  [
    'Iqra Foundation er avhengig av gaver og samarbeid for å kunne utvikle nye tilbud. Med din støtte kan vi gjennomføre flere kurs, arrangementer og prosjekter – og bygge møteplasser som kommer mange til gode, i dag og for kommende generasjoner.',
    'Gaver og samarbeid er det som lar oss lage nye tilbud. Med flere gaver kan vi holde flere kurs, arrangementer og prosjekter. Vi kan også bygge møteplasser som mange får glede av i årene som kommer.',
  ],
  [
    'Bidra til kunnskap, dialog og fellesskap',
    'Støtt Iqra Foundation',
  ],
  [
    'Gjennom aktiviteter, samarbeid og kunnskapsformidling vil Iqra Foundation bidra til et mer opplyst, inkluderende og engasjert samfunn.',
    'Med aktiviteter, samarbeid og formidling vil Iqra Foundation bidra til et mer opplyst og inkluderende samfunn, der flere engasjerer seg.',
  ],
  [
    'Vi skaper muligheter for læring og personlig utvikling gjennom kurs, foredrag og undervisning.',
    'Kurs, foredrag og undervisning gir folk mulighet til å lære og utvikle seg.',
  ],
  [
    'Vi inspirerer ungdom og voksne til å ta initiativ, engasjere seg og bidra til positiv samfunnsutvikling.',
    'Vi oppmuntrer ungdom og voksne til å ta initiativ og engasjere seg i samfunnet rundt seg.',
  ],
  [
    'Vi bygger relasjoner og arenaer hvor mennesker, organisasjoner og fagmiljøer kan møtes og samarbeide.',
    'Vi bygger relasjoner og lager steder der folk, organisasjoner og fagmiljøer kan møtes og jobbe sammen.',
  ],
  [
    'Kurs, foredrag og opplæring som styrker både faglig kompetanse og personlig utvikling. Vi vektlegger kvalitet, kritisk refleksjon og relevans for deltakernes hverdag.',
    'Kurs, foredrag og opplæring som gir faglig påfyll og personlig utvikling. Vi legger vekt på kvalitet og kritisk tenkning, og på at det skal være nyttig i hverdagen.',
  ],
  [
    'Vi inspirerer ungdom og voksne til å ta initiativ, utvikle lederskap og bidra gjennom frivillighet og samfunnsansvar – lokalt og nasjonalt.',
    'Vi oppmuntrer ungdom og voksne til å ta initiativ og lede. Vi vil også at flere skal bidra som frivillige, lokalt og nasjonalt.',
  ],
  [
    'Vi etablerer fysiske og digitale arenaer for dialog og samarbeid mellom enkeltpersoner, organisasjoner, fagmiljøer og offentlige institusjoner.',
    'Vi lager steder for samtale og samarbeid, fysisk og på nett. Der kan enkeltpersoner, organisasjoner, fagmiljøer og offentlige institusjoner møtes.',
  ],
  [
    'Varig samfunnsutvikling skapes gjennom felles innsats. Vi ønsker samarbeid med organisasjoner, institusjoner, fagmiljøer, virksomheter og enkeltpersoner – nasjonalt og internasjonalt – som deler vårt engasjement for kunnskap, dialog og fellesskap.',
    'Varige endringer i samfunnet krever at mange gjør noe sammen. Vi vil gjerne samarbeide med organisasjoner, fagmiljøer, virksomheter og enkeltpersoner i Norge og internasjonalt som er opptatt av kunnskap og dialog.',
  ],
  [
    'Iqra er arabisk og betyr «les». Ordet er det første som ble åpenbart i Koranen, og det uttrykker en grunnleggende oppfordring til å søke kunnskap og forståelse. Navnet sier hva vi står for: at læring og opplysning er selve fundamentet for menneskelig utvikling og et godt samfunn.',
    'Iqra er arabisk og betyr «les». Det var det første ordet som ble åpenbart i Koranen, en oppfordring til å søke kunnskap og forståelse. Navnet viser hva vi står for. Vi mener læring og opplysning er grunnlaget for at mennesker og samfunn utvikler seg.',
  ],
  [
    'Verdigrunnlaget er forankret i stiftelsens vedtekter og skal ivaretas i all virksomhet, også på lang sikt.',
    'Verdiene står i stiftelsens vedtekter. De skal gjelde for alt stiftelsen gjør, også på lang sikt.',
  ],
  [
    'Virksomheten retter seg primært mot ungdom og voksne. Våre arrangementer og tilbud er åpne for alle som ønsker å lære, delta og bidra.',
    'Vi retter oss mest mot ungdom og voksne. Arrangementene og tilbudene er åpne for alle som vil lære og bidra.',
  ],
  [
    'Iqra Foundation omsetter kunnskap, verdier og engasjement til konkrete tiltak. Arbeidet er organisert i seks innsatsområder.',
    'Iqra Foundation gjør kunnskap og verdier om til konkrete tiltak. Arbeidet er delt inn i seks områder.',
  ],
  [
    'Vi gjennomfører og støtter undervisning, kurs og kompetansehevende tiltak. Tilbudene skal gi deltakerne faglig påfyll, styrke evnen til kritisk refleksjon og gjøre dem bedre rustet til å delta i arbeidsliv, utdanning og samfunnsliv.',
    'Vi holder og støtter kurs og undervisning. Deltakerne skal lære noe nytt og bli flinkere til å tenke kritisk. Det skal gjøre det lettere å delta i arbeid, utdanning og samfunnsliv.',
  ],
  [
    'Vi arrangerer seminarer, foredrag, konferanser, debatter og panelsamtaler om faglige og samfunnsaktuelle spørsmål. Vi inviterer fagpersoner, praktikere og beslutningstakere, og legger vekt på at ulike perspektiver kommer til orde.',
    'Vi holder seminarer, foredrag og debatter om faglige spørsmål og saker i samfunnet. Fagfolk, praktikere og beslutningstakere blir invitert, og ulike syn skal komme fram.',
  ],
  [
    'Vi tar initiativ til samtaler og samarbeid mellom mennesker og miljøer som sjelden møtes. Målet er økt kulturforståelse, færre fordommer og sterkere tillit i samfunnet.',
    'Vi tar initiativ til samtaler og samarbeid mellom mennesker og miljøer som sjelden møtes. Målet er at folk skal forstå og stole mer på hverandre, med færre fordommer.',
  ],
  [
    'Vi initierer, støtter og gjennomfører prosjekter som fremmer deltakelse, frivillighet, lederskap og samfunnsansvar. Vi ønsker særlig å gi ungdom og unge voksne erfaring med å ta ansvar, lede prosesser og engasjere seg i lokalsamfunnet.',
    'Vi starter og støtter prosjekter der folk er frivillige og lærer å lede. Særlig ungdom og unge voksne skal få erfaring med å ta ansvar og engasjere seg der de bor.',
  ],
  [
    'Vi produserer og formidler artikler, rapporter, digitale ressurser og annet opplysningsmateriell. Gjennom dette gjør vi faglig og samfunnsrelevant kunnskap tilgjengelig for et bredere publikum.',
    'Vi skriver og deler artikler, rapporter og digitale ressurser. Slik blir faglig kunnskap tilgjengelig for flere.',
  ],
  [
    'Vi samarbeider med nasjonale og internasjonale organisasjoner, institusjoner og fagmiljøer når det styrker gjennomføringen av stiftelsens formål. Samarbeid skjer på grunnlag av felles mål, åpenhet og gjensidig respekt.',
    'Vi samarbeider med organisasjoner, institusjoner og fagmiljøer i Norge og i utlandet når det hjelper stiftelsen å nå formålet. Samarbeidet bygger på felles mål, åpenhet og respekt.',
  ],
  [
    'Iqra Foundation ledes av et styre med bred erfaring fra samfunnsfag, organisasjonsliv, språk og formidling. Styret er stiftelsens øverste organ.',
    'Iqra Foundation ledes av et styre, som er stiftelsens øverste organ. Medlemmene har erfaring fra samfunnsfag, organisasjonsliv, språk og formidling.',
  ],
  [
    'Styret har det overordnede ansvaret for stiftelsens strategi, økonomi, organisering og gjennomføring av formålet, og representerer stiftelsen utad. Styret består av fem medlemmer som velges for to år av gangen. Ett av medlemmene har særskilt ansvar for økonomi.',
    'Styret har ansvaret for stiftelsens strategi, økonomi og organisering, og for at formålet blir fulgt. Det representerer også stiftelsen utad. Styret har fem medlemmer, valgt for to år av gangen, og ett av dem har særlig ansvar for økonomi.',
  ],
  [
    'Her finner du nyheter, kunngjøringer og arrangementer fra Iqra Foundation.',
    'Nyheter, kunngjøringer og arrangementer fra Iqra Foundation.',
  ],
  [
    'Kommende seminarer, konferanser, foredrag og kurs, med informasjon om tid, sted, program og påmelding. Arkivet viser tidligere arrangementer med referater og opptak der det er tilgjengelig.',
    'Kommende seminarer, foredrag og kurs, med tid, sted, program og påmelding. Arkivet viser tidligere arrangementer med referater og opptak der det er tilgjengelig.',
  ],
  [
    'Meld deg på nyhetsbrevet',
    'Nyhetsbrevet',
  ],
  [
    'for å få invitasjoner og oppdateringer direkte.',
    'sender invitasjoner og oppdateringer direkte på e-post.',
  ],
  [
    'Stiftelsens vedtekter, årsregnskap, årsberetning og andre sentrale dokumenter. Vi publiserer disse for å sikre åpenhet om hvordan stiftelsen styres og hvordan midlene brukes.',
    'Stiftelsens vedtekter, årsregnskap, årsberetning og andre viktige dokumenter. De ligger her så alle kan se hvordan stiftelsen styres og hvordan pengene brukes.',
  ],
  [
    'Slik kan du bidra',
    'Måter å bidra på',
  ],
  [
    'Bidra med tid, kompetanse og engasjement i arrangementer og prosjekter.',
    'Frivillige hjelper til med tid og kompetanse i arrangementer og prosjekter.',
  ],
];
const rewritten = (s: string) => REWRITES.reduce((t, [was, now]) => t.replaceAll(was, now), s);


const [, rest] = file.split('\n## M\n');
const [m, d] = rest.split('\n## D\n');

function strings(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (v && typeof v === 'object') return Object.values(v).flatMap(strings);
  return [];
}

/** The keys in `resources.categories` are slugs, not the client's words. */
const keys = new Set<string>(klient.resources.categories.map((c) => c.key));
const ours = strings(klient).filter((s) => !keys.has(s));

describe('every string in klient.no.ts is the client’s, unchanged', () => {
  const sources = rewritten(plain(m) + ' ' + plain(d));
  test.each(ours)('%s', (s) => {
    expect(sources).toContain(plain(s));
  });
});

/**
 * What may stay in a document paragraph once the client's strings are taken out of it.
 * Everything else left over is a sentence the site does not carry.
 */
const LEFTOVERS = [
  // Section numbers and the document's own title: the document's structure, not site text.
  /^\d\. .*$/,
  /^Iqra Foundation – nettsidetekst$/,
  // Values the client has not supplied yet (Q6, Q10).
  /\[Kontonummer \/ Vipps-nummer\]/,
  /Facebook og Instagram: \[brukernavn\]/,
  // Buttons are written in brackets and joined by «·»; a stray «[» after «styreleder» (Q4).
  /[[\]·]/g,
  // The contact line's labels: the site writes its own labels for these.
  /(Org\.nr\.|Telefon:|E-post:)/g,
  // Board lines join name and role with «–».
  / – /g,
];

describe('every paragraph of the client’s document is carried', () => {
  const paragraphs = d
    .split(/\n\s*\n/)
    .map((p) => rewritten(plain(p.replace(/^- /, ''))))
    .filter(Boolean);
  const pieces = [...ours].map(plain).sort((a, b) => b.length - a.length);

  test.each(paragraphs)('%s', (p) => {
    let left = p;
    for (const s of pieces) left = left.split(s).join(' ');
    for (const re of LEFTOVERS) left = left.replace(re, ' ');
    expect(left.replace(/[\s.,–]+/g, '')).toBe('');
  });
});

test('the message’s four Ressurser categories, in its order', () => {
  expect(klient.resources.categories.map((c) => c.title)).toEqual([
    'Publikasjoner og rapporter',
    'Artikler og fagstoff',
    'Videoer og presentasjoner',
    'Styringsdokumenter',
  ]);
});

test('Menneskene bak: the five board members, and no one else', () => {
  expect(klient.people.members).toHaveLength(5);
});

test.each(REWRITES)('the rewritten text is still the client’s to begin with: %s', (was) => {
  expect(plain(m) + ' ' + plain(d)).toContain(was);
});

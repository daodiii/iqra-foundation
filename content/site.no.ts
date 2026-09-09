/**
 * Misjon is set as three stanzas with the line breaks chosen by hand, so each line is a
 * phrase rather than wherever the browser ran out of room. `text` is derived from them
 * rather than written twice: it is what a screen reader and the e2e see, and deriving it
 * means an edit to the stanzas cannot leave a second copy of the sentence behind.
 */
const missionStanzas = [
  ['Vi forteller om islam', 'på en vennlig og ærlig måte.'],
  ['Vi inviterer til samtaler,', 'svarer på spørsmål,', 'og møter folk der de er.'],
  ['Slik bygger vi broer,', 'og lærer av hverandre.'],
] as const;

/**
 * Støtt oss asks for a standing gift, so these are monthly amounts and there is no
 * one-off/monthly toggle to set them against. They start at 200 because the site's own
 * skattefradrag sentence puts the floor for a deductible year at 500 kroner, and the
 * smallest of these clears it two and a half times over.
 *
 * What each amount BUYS is deliberately not here. Naming outcomes was considered and
 * rejected: every figure would have been mine rather than anyone's, and a page that tells
 * you what your money turns into has to be able to show that it did.
 */
const supportTiers = [200, 300, 500, 1000] as const;

/**
 * The three ways to give, in the order the film's colours run — slate, gold, night.
 *
 * They are inert text, which is the whole reason they lead: every number on this page is
 * still a placeholder, and a route you copy into your own bank is the one kind of payment
 * that needs nothing built. Vipps sits in the middle because it is how people here
 * actually pay, and AvtaleGiro last because it is the only one that repeats by itself.
 */
const supportRoutes = [
  {
    label: 'Kontonummer',
    value: '[KONTO]',
    how: 'Overfør beløpet selv, og merk betalingen med navnet ditt.',
  },
  {
    label: 'Vipps',
    value: '[NUMMER]',
    how: 'Åpne Vipps, velg Betal, og søk opp nummeret.',
  },
  {
    label: 'AvtaleGiro',
    value: '[KID]',
    how: 'Fast trekk hver måned. Du oppretter den i nettbanken din.',
  },
] as const;

export const site = {
  lang: 'nb',
  name: 'Iqra Foundation',
  meta: {
    title: 'Iqra Foundation',
    description: 'Iqra betyr les. Vi snakker gjerne med deg om islam.',
    /** What a shared link shows. The poster is the film's first frame. */
    imageAlt: 'Fjell i dis, i lyset før soloppgang.',
  },
  /** The organisation number is `support.orgnr`: one gift, one number, one place. */
  footer: { place: 'Oslo' },
  header: { wordmark: 'IQRA', homeLabel: 'Iqra Foundation, til toppen', navLabel: 'Hovedmeny' },
  hero: {
    /**
     * The lockup the mask cuts out of the white. Two lines, because the name is the
     * name: IQRA large, FOUNDATION set smaller underneath and tracked out to the same
     * width. The sizes live in Hero.tsx, because they are drawing, not copy.
     */
    wordLines: ['IQRA', 'FOUNDATION'],
    h1Lines: ['Iqra betyr', 'les'],
    lede: 'Det er det første ordet i Koranen. For oss betyr det å lese, å lære, og å snakke med folk som lurer på noe.',
    cta: 'Still et spørsmål',
    hint: 'Bla nedover',
  },
  vision: {
    label: 'Visjon',
    lines: ['Vi vil ha et Norge', 'der folk kjenner islam', 'fra ekte møter,', 'ikke fra overskrifter.'],
    sub: 'Der det er lett å spørre, og lett å få et ærlig svar.',
    tree: {
      root: 'Iqra',
      limbs: ['Dialog', 'Brobygging', 'Kunnskap'],
      label: 'Et tre: roten er Iqra, greinene er Dialog, Brobygging og Kunnskap',
    },
  },
  mission: {
    label: 'Misjon',
    stanzas: missionStanzas,
    text: missionStanzas.flat().join(' '),
  },
  about: {
    label: 'Om oss',
    meta: {
      title: 'Om oss — Iqra Foundation',
      description: 'Fire kapitler om hvem vi er, hvorfor vi begynte, og hva vi holder på med.',
    },
    hint: 'Bla for å bla om',
    cover: {
      title: 'Om oss',
      sub: 'Fire kapitler om hvem vi er, hvorfor vi begynte, og hva vi holder på med.',
    },
    openerLabel: 'Kapittel',
    chapters: [
      {
        num: 'I',
        title: 'Historien',
        lede: 'Det begynte rundt et kjøkkenbord, med en samtale som ikke ville ta slutt.',
        paras: [
          'Vi startet i 2019, i Oslo. Noen få folk som var lei av at islam bare dukket opp i nyhetene når noe var galt.',
          'Navnet kommer fra det første ordet som ble åpenbart i Koranen. Iqra. Les.',
          'Vi ville lage et sted der folk kunne spørre om hva som helst, og få et ærlig svar.',
        ],
      },
      {
        num: 'II',
        title: 'Menneskene',
        lede: 'Ingen av oss gjør dette på heltid. Vi gjør det fordi vi liker samtalene.',
        paras: ['Rundt tjue stykker. Studenter, lærere, en snekker, to sykepleiere.'],
        team: [
          { name: '[Navn]', role: 'Leder' },
          { name: '[Navn]', role: 'Nestleder' },
          { name: '[Navn]', role: 'Styremedlem' },
          { name: '[Navn]', role: 'Frivillig' },
          { name: '[Navn]', role: 'Frivillig' },
          { name: '[Navn]', role: 'Frivillig' },
        ],
      },
      {
        num: 'III',
        title: 'Arbeidet',
        lede: 'Vi møter folk der de er. Som regel betyr det på gata, eller over en kopp te.',
        paras: [
          'Vi står på stand i byen. Vi holder åpne kvelder i moskeen.',
          'Vi svarer på e-post, og vi drar dit vi blir invitert.',
        ],
        figures: [
          { value: '[N]', label: 'samtaler i året' },
          { value: '[N]', label: 'åpne kvelder' },
        ],
      },
    ],
    ask: {
      title: 'Har du et spørsmål?',
      lede: 'Vi svarer på alt. Også det du tror er dumt.',
    },
    contact: {
      label: 'Kontakt',
      para: 'Skriv til oss, så svarer et menneske. Vanligvis samme uka.',
      place: 'Iqra Foundation, Oslo',
    },
  },
  support: {
    label: 'Støtt oss',
    /**
     * Two hand-set lines, sized at runtime so the longer of them lands on the measure.
     * They are written from what Om oss already says — «Rundt tjue stykker» and «Ingen av
     * oss gjør dette på heltid» — and claim nothing about the foundation's finances.
     * Changing them is a one-line edit: the heading measures whatever it is given.
     */
    title: ['Tjue stykker gjør arbeidet.', 'Faste givere gjør at det fortsetter.'],
    routes: supportRoutes,
    routesLabel: 'Slik gir du',
    giver: {
      label: 'Fast giver',
      unit: 'kr i måneden',
      amountLabel: 'Velg beløp',
      /** The amount preselected on arrival, as an index into `tiers`. */
      preselect: 1,
    },
    tiers: supportTiers,
    /**
     * The QR is bracketed like every other number on this page, and for the same reason:
     * a real one has to be issued by Vipps against a real number. Drawing a plausible
     * square here would be worse than leaving it out — it would be the one placeholder on
     * the site that a visitor could try, and it would fail silently in their bank app.
     */
    qr: {
      value: '[QR-KODE]',
      title: 'Vipps',
      how: 'Skann koden, eller søk opp nummeret i appen. Du velger beløpet selv.',
    },
    fields: {
      orgnr: 'Organisasjonsnummer',
    },
    orgnr: '[ORG.NR]',
    /**
     * True only if the foundation is on Skatteetaten's list of approved recipients
     * (skatteloven § 6-50) — approval is per organisation and has to be applied for.
     * The bracket is load-bearing: it holds the production build until whoever fills in
     * the organisation number has confirmed the approval that makes this sentence true.
     */
    tax: 'Gaver mellom 500 og 25 000 kroner i året gir skattefradrag. Vi rapporterer gaven på organisasjonsnummer [ORG.NR], og trenger fødselsnummeret ditt for å gjøre det.',
  },
  contact: { email: '[EPOST]' },
} as const;

export type Site = typeof site;

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
 * Støtt oss. The amounts are a design choice and stand as they are; what each one buys
 * is a claim about how the money is actually spent, and every one of them is mine
 * rather than anyone's figure — so the whole outcome is bracketed, unit and all. The
 * two lines of a tier have to be filled in together: «hver måned» is the same claim
 * twelve times over, and they will read as a contradiction if only one is updated.
 */
const supportTiers = [
  { kr: 100, once: '[4 samtaler på stand]', month: '[48 samtaler i året]' },
  { kr: 250, once: '[10 samtaler på stand]', month: '[120 samtaler i året]' },
  { kr: 500, once: '[en åpen kveld i moskeen]', month: '[12 åpne kvelder i året]' },
  { kr: 1000, once: '[20 bøker til folk som spør]', month: '[240 bøker i året]' },
  { kr: 2500, once: '[en uke på stand i Oslo]', month: '[stand hver eneste uke]' },
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
    /** The drape to the right of the copy. Read by the renderer, not by the layout. */
    drape: { label: 'Et bånd av farge i blått, turkis og vinrødt' },
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
    /** `{beløp}` is filled in with the chosen amount, so the sentence stays here. */
    give: { once: 'Gi {beløp} kr med Vipps', month: 'Gi {beløp} kr i måneden med Vipps' },
    unit: { once: 'kr', month: 'kr / mnd' },
    frequency: { label: 'Hvor ofte', once: 'Én gang', month: 'Hver måned' },
    amountLabel: 'Velg beløp',
    tiers: supportTiers,
    /**
     * Vipps handles both a single gift and a standing one, AvtaleGiro exists only for
     * the recurring case, and a plain transfer only makes sense for the one-off. So the
     * second route follows the frequency rather than sitting there being wrong half the
     * time, and there are two of these rather than one.
     */
    alt: { once: 'Eller overfør til konto', month: 'Eller sett opp AvtaleGiro' },
    transfer: {
      title: 'Bankoverføring',
      para: 'Overfør beløpet selv, og merk betalingen med navnet ditt hvis du vil ha skattefradrag. Da vet vi hvem gaven kom fra.',
    },
    avtalegiro: {
      title: 'AvtaleGiro',
      para: 'Fast trekk fra kontoen din hver måned. Du oppretter den i nettbanken din med tallene under, og du kan stoppe den selv når som helst.',
    },
    fields: {
      account: 'Kontonummer',
      kid: 'KID',
      amount: 'Beløp',
      vipps: 'Vipps',
      orgnr: 'Organisasjonsnummer',
    },
    account: '[KONTO]',
    kid: '[KID]',
    vippsNumber: '[NUMMER]',
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

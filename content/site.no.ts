export const site = {
  lang: 'nb',
  name: 'Iqra Foundation',
  meta: {
    title: 'Iqra Foundation',
    description: 'Iqra betyr les. Vi snakker gjerne med deg om islam.',
  },
  header: { wordmark: 'IQRA', homeLabel: 'Iqra Foundation, til toppen' },
  hero: {
    word: 'IQRA',
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
    text: 'Vi forteller om islam på en vennlig og ærlig måte. Vi inviterer til samtaler, svarer på spørsmål og møter folk der de er. Slik bygger vi broer, og lærer av hverandre.',
  },
  contact: { email: '[EPOST]' },
} as const;

export type Site = typeof site;

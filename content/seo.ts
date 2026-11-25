import type { Lang, PageKey } from './paths';

/**
 * What a search engine shows for each page: the title in the results and the description under it
 * (2026-11-25, from the SEO audit; the user: «page titles and descriptions for the SEO, but not change
 * anything on the page itself»). Only `<title>` and `<meta name="description">` read this; the pages'
 * own headings and text stay the owner's.
 *
 * Each title is whole (the layout's «– Iqra Foundation» template is not added) and at most 60
 * characters, the name once; each description 70–160 characters and only restates what its page says.
 * A page missing here keeps the title and description it had (the legal pages, the articles).
 */
export type Seo = { title: string; description: string };

export const SEO: Record<Lang, Partial<Record<PageKey, Seo>>> = {
  no: {
    home: {
      title: 'Iqra Foundation – allmennyttig stiftelse i Oslo',
      description:
        'Allmennyttig stiftelse i Oslo, bygget på islamske verdier. Kurs, foredrag, seminarer og møteplasser for kunnskap, dialog og samfunnsdeltakelse.',
    },
    about: {
      title: 'Om oss: allmennyttig stiftelse i Oslo – Iqra Foundation',
      description:
        'Iqra Foundation STI er en allmennyttig stiftelse i Oslo, org.nr. 817 388 752, under tilsyn av Stiftelsestilsynet. Les om formål, verdier og målgrupper.',
    },
    work: {
      title: 'Vårt arbeid: kurs, seminarer og dialog – Iqra Foundation',
      description:
        'Sju arbeidsområder: kurs og opplæring, seminarer og panelsamtaler, dialog, prosjekter og frivillighet, publikasjoner, møteplasser og samarbeid.',
    },
    people: {
      title: 'Menneskene bak: styret – Iqra Foundation',
      description: 'Iqra Foundation ledes av et styre, stiftelsens øverste organ. Her er styrets medlemmer, og slik kontakter du styret.',
    },
    news: {
      title: 'Aktuelt: nyheter og arrangementer – Iqra Foundation',
      description: 'Nyheter, kunngjøringer og kommende arrangementer fra Iqra Foundation i Oslo: seminarer, foredrag og kurs.',
    },
    newsItems: {
      title: 'Nyheter fra stiftelsen – Iqra Foundation',
      description: 'Nyheter og kunngjøringer fra Iqra Foundation: oppdateringer om stiftelsens arbeid, nye prosjekter og samarbeid.',
    },
    events: {
      title: 'Arrangementer: seminarer, foredrag og kurs – Iqra Foundation',
      description: 'Kommende seminarer, foredrag og kurs fra Iqra Foundation i Oslo, med tid, sted, program og påmelding.',
    },
    archive: {
      title: 'Arkiv: tidligere arrangementer – Iqra Foundation',
      description: 'Tidligere arrangementer fra Iqra Foundation, med referater og opptak der det er tilgjengelig.',
    },
    resources: {
      title: 'Ressurser: publikasjoner og fagstoff – Iqra Foundation',
      description:
        'Ressursbiblioteket til Iqra Foundation: publikasjoner og rapporter, artikler og fagstoff, videoer og presentasjoner, og stiftelsens styringsdokumenter.',
    },
    contact: {
      title: 'Kontakt oss – Iqra Foundation',
      description: 'Kontakt Iqra Foundation på post@iqrasti.no, telefon +47 941 43 585 eller kontaktskjemaet. Postadresse: Postboks 9044, 0133 Oslo.',
    },
    support: {
      title: 'Støtt oss: Vipps eller AvtaleGiro – Iqra Foundation',
      description: 'Gi en gave til Iqra Foundation med Vipps (26354) eller fast med AvtaleGiro. Gavene gir flere kurs, arrangementer og møteplasser.',
    },
  },
  en: {
    home: {
      title: 'Iqra Foundation – a non-profit foundation in Oslo',
      description:
        'A non-profit foundation in Oslo grounded in Islamic values. Courses, lectures, seminars and meeting places for knowledge, dialogue and civic life.',
    },
    about: {
      title: 'About us: a non-profit foundation in Oslo – Iqra Foundation',
      description:
        'Iqra Foundation STI is a non-profit foundation in Oslo, org. no. 817 388 752, supervised by Stiftelsestilsynet. Read about our purpose and values.',
    },
    work: {
      title: 'Our work: courses, seminars and dialogue – Iqra Foundation',
      description:
        'Seven areas of work: courses and training, seminars and panels, dialogue, projects and volunteering, publications, meeting places and partnerships.',
    },
    people: {
      title: 'Our people: the board – Iqra Foundation',
      description: 'Iqra Foundation is led by a board, its highest governing body. Meet the board members and find out how to contact them.',
    },
    news: {
      title: 'News and events – Iqra Foundation',
      description: 'News, announcements and upcoming events from Iqra Foundation in Oslo: seminars, lectures and courses.',
    },
    newsItems: {
      title: 'News from the foundation – Iqra Foundation',
      description: 'News and announcements from Iqra Foundation: updates on the foundation’s work, new projects and partnerships.',
    },
    events: {
      title: 'Events: seminars, lectures and courses – Iqra Foundation',
      description: 'Upcoming seminars, lectures and courses from Iqra Foundation in Oslo, with time, place, programme and registration.',
    },
    archive: {
      title: 'Archive: past events – Iqra Foundation',
      description: 'Past events from Iqra Foundation, with summaries and recordings where available.',
    },
    resources: {
      title: 'Resources: publications and articles – Iqra Foundation',
      description:
        'Iqra Foundation’s resource library: publications and reports, articles, videos and presentations, and the foundation’s governing documents.',
    },
    contact: {
      title: 'Contact us – Iqra Foundation',
      description: 'Contact Iqra Foundation at post@iqrasti.no, by phone on +47 941 43 585 or through the contact form. Postal address: Postboks 9044, 0133 Oslo.',
    },
    support: {
      title: 'Support us: Vipps or AvtaleGiro – Iqra Foundation',
      description: 'Give to Iqra Foundation with Vipps (26354) or regularly with AvtaleGiro. Your gifts make more courses, events and meeting places possible.',
    },
  },
};
